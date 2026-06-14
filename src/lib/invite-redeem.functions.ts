import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";

export const validateInvite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(8).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = createHash("sha256").update(data.token).digest("hex");
    const { data: row, error } = await supabaseAdmin
      .from("invites")
      .select("email, role, status, expires_at")
      .eq("token_hash", hash)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { valid: false as const, reason: "not_found" as const };
    if (row.status !== "pending") return { valid: false as const, reason: row.status as string };
    if (new Date(row.expires_at) <= new Date())
      return { valid: false as const, reason: "expired" as const };
    return { valid: true as const, email: row.email, role: row.role as string };
  });

export const redeemInviteWithPassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().min(8).max(200),
        password: z.string().min(8).max(200),
        displayName: z.string().min(1).max(100).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = createHash("sha256").update(data.token).digest("hex");

    const { data: inv, error: invErr } = await supabaseAdmin
      .from("invites")
      .select("id, email, role, status, expires_at")
      .eq("token_hash", hash)
      .maybeSingle();
    if (invErr) throw new Error(invErr.message);
    if (!inv) throw new Error("Invite not found");
    if (inv.status !== "pending") throw new Error(`Invite ${inv.status}`);
    if (new Date(inv.expires_at) <= new Date()) throw new Error("Invite expired");

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: inv.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName ?? inv.email.split("@")[0] },
    });
    if (cErr) throw new Error(cErr.message);
    if (!created.user?.id) throw new Error("Could not create member account");

    const displayName = data.displayName ?? inv.email.split("@")[0];
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      email: inv.email.toLowerCase(),
      display_name: displayName,
    });
    if (profileErr) throw new Error(profileErr.message);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: inv.role });
    if (roleErr) throw new Error(roleErr.message);

    const { error: acceptErr } = await supabaseAdmin
      .from("invites")
      .update({ status: "accepted", accepted_by: created.user.id, accepted_at: new Date().toISOString() })
      .eq("id", inv.id);
    if (acceptErr) throw new Error(acceptErr.message);

    return { ok: true, email: inv.email, userId: created.user?.id };
  });

export const redeemInviteAfterOAuth = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().min(8).max(200),
        userId: z.string().uuid(),
        email: z.string().email(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data: role, error } = await supabaseAdmin.rpc("consume_invite" as any, {
        _token: data.token,
        _user_id: data.userId,
        _email: data.email,
      });
      if (error) throw new Error(error.message);
      const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
        id: data.userId,
        email: data.email.toLowerCase(),
        display_name: data.email.split("@")[0],
      });
      if (profileErr) throw new Error(profileErr.message);
      return { ok: true, role };
    } catch (e) {
      // Mismatch or invalid → delete the just-created auth user so they don't linger
      try {
        await supabaseAdmin.auth.admin.deleteUser(data.userId);
      } catch {}
      throw e;
    }
  });
