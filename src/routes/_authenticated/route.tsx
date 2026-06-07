import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const investorAllowedRoutes = ["/", "/pilots", "/proof", "/team", "/milestones", "/investor"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth" });
    }
    const user = session.user;

    // Determine role from user_roles table
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = (roleRows ?? []).map((r: any) => r.role as string);
    const role = roles.includes("founder")
      ? "founder"
      : roles.includes("team")
      ? "team"
      : roles[0] ?? "investor";

    // Block investors from non-allowed routes
    if (role === "investor" && !investorAllowedRoutes.includes(location.pathname)) {
      throw redirect({ to: "/" });
    }

    return { user, role };
  },
  component: () => <Outlet />,
});
