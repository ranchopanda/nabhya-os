import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ROLES = ["founder", "team", "investor"] as const;

async function assertFounder(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "founder" });
  if (error) throw new Error(`Permission check failed: ${error.message}`);
  if (!data) throw new Error("Only founders can do this. Your account isn't a founder.");
}

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), role: z.enum(ROLES) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFounder(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Last-founder guard
    if (data.role !== "founder") {
      const { data: founders, error: fErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "founder");
      if (fErr) throw new Error(fErr.message);
      const founderIds = (founders ?? []).map((r: any) => r.user_id);
      if (founderIds.length <= 1 && founderIds.includes(data.userId)) {
        throw new Error("Cannot demote the last founder");
      }
    }

    const { error: delErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (delErr) throw new Error(delErr.message);

    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (insErr) throw new Error(insErr.message);

    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertFounder(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Block removing the last founder (or self if last founder)
    const { data: founders, error: fErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "founder");
    if (fErr) throw new Error(fErr.message);
    const founderIds = (founders ?? []).map((r: any) => r.user_id);
    if (founderIds.includes(data.userId) && founderIds.length <= 1) {
      throw new Error("Cannot remove the last founder");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
