import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "founder" | "team" | "investor";

function pickRole(roles: string[]): Role {
  if (roles.includes("founder")) return "founder";
  if (roles.includes("team")) return "team";
  if (roles.includes("investor")) return "investor";
  return "team";
}

export const ensureCurrentMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const user = userData.user;
    const metadata = user?.user_metadata ?? {};
    const email = user?.email ?? (context.claims as { email?: string }).email ?? null;
    const displayName =
      (metadata.full_name as string | undefined) ??
      (metadata.name as string | undefined) ??
      (metadata.display_name as string | undefined) ??
      email?.split("@")[0] ??
      "Team member";
    const avatarUrl = (metadata.avatar_url as string | undefined) ?? (metadata.picture as string | undefined) ?? null;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (profileError) throw profileError;

    const [{ data: myRoles, error: myRolesError }, { count: founderCount, error: countError }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
      supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "founder"),
    ]);
    if (myRolesError) throw myRolesError;
    if (countError) throw countError;

    const roles = (myRoles ?? []).map((row) => row.role as string);
    if (roles.length === 0) {
      const role: Role = (founderCount ?? 0) === 0 ? "founder" : "team";
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
      if (roleError) throw roleError;
      roles.push(role);
    }

    return { profile: { id: userId, email, display_name: displayName, avatar_url: avatarUrl }, role: pickRole(roles) };
  });