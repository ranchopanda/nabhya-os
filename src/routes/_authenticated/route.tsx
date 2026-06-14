import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const investorAllowedRoutes = ["/", "/pilots", "/proof", "/team", "/milestones", "/investor"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      throw redirect({ to: "/auth" });
    }

    // Determine role from user_roles table
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = (roleRows ?? []).map((r: any) => r.role as string);
    if (roles.length === 0) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }
    const role = roles.includes("founder")
      ? "founder"
      : roles.includes("team")
        ? "team"
        : roles[0];

    // Block investors from non-allowed routes
    if (role === "investor" && !investorAllowedRoutes.includes(location.pathname)) {
      throw redirect({ to: "/" });
    }

    return { user, role };
  },
  component: () => <Outlet />,
});
