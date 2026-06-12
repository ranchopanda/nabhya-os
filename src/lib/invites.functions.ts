import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";

const ROLES = ["founder", "team", "investor"] as const;

async function assertFounder(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "founder" });
  if (error) throw new Error("Only founders can do this");
  if (!data) throw new Error("Only founders can do this");
}

function makeToken() {
  const raw = randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export const createInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().email().max(255),
        role: z.enum(ROLES),
        expiresInDays: z.number().int().min(1).max(60).default(7),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFounder(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const emailLc = data.email.toLowerCase();

    // Reject if user already exists with this email
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", emailLc)
      .maybeSingle();
    if (existingProfile) {
      throw new Error("A member with this email already exists");
    }

    // Reject if a pending, non-expired invite already exists for this email
    const { data: dupe } = await supabaseAdmin
      .from("invites")
      .select("id")
      .eq("email", emailLc)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (dupe) {
      throw new Error("A pending invite already exists for this email. Revoke it first or use 'New link'.");
    }

    const { raw, hash } = makeToken();
    const expiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString();


    const { data: row, error } = await supabaseAdmin
      .from("invites")
      .insert({
        email: data.email.toLowerCase(),
        role: data.role,
        token_hash: hash,
        invited_by: context.userId,
        expires_at: expiresAt,
      })
      .select("id, email, role, expires_at, status, created_at")
      .single();
    if (error) throw new Error(error.message);

    return { invite: row, token: raw };
  });

export const listInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Auto-expire stale pending invites
    await supabaseAdmin
      .from("invites")
      .update({ status: "expired" })
      .lt("expires_at", new Date().toISOString())
      .eq("status", "pending");

    const { data, error } = await supabaseAdmin
      .from("invites")
      .select("id, email, role, status, created_at, expires_at, accepted_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { invites: data ?? [] };
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertFounder(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("invites")
      .update({ status: "revoked" })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), expiresInDays: z.number().int().min(1).max(60).default(7) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFounder(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { raw, hash } = makeToken();
    const expiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const { data: row, error } = await supabaseAdmin
      .from("invites")
      .update({ token_hash: hash, expires_at: expiresAt, status: "pending", accepted_at: null, accepted_by: null })
      .eq("id", data.id)
      .select("id, email, role, expires_at, status, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { invite: row, token: raw };
  });

export const purgeNonFounders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFounder(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find all founder user_ids
    const { data: founders, error: fErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "founder");
    if (fErr) throw new Error(fErr.message);
    const founderIds = new Set((founders ?? []).map((r: any) => r.user_id));

    // List auth users (paginate)
    let removed = 0;
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      const users = data?.users ?? [];
      if (users.length === 0) break;
      for (const u of users) {
        if (!founderIds.has(u.id)) {
          await supabaseAdmin.auth.admin.deleteUser(u.id);
          removed++;
        }
      }
      if (users.length < 200) break;
      page++;
    }
    return { removed };
  });
