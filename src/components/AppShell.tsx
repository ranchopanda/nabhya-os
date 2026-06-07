import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/nabhya-logo.asset.json";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, Rocket, ShieldCheck, Wrench, FileCheck2,
  Megaphone, UsersRound, FolderKanban, ListTodo, History, Eye, LogOut, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentRole } from "@/hooks/use-current-role";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/crm", label: "CRM Pipeline", icon: Users },
  { to: "/pilots", label: "Pilots", icon: Rocket },
  { to: "/proof", label: "Proof Vault", icon: ShieldCheck },
  { to: "/product", label: "Product Log", icon: Wrench },
  { to: "/applications", label: "Applications", icon: FileCheck2 },
  { to: "/content", label: "Content", icon: Megaphone },
  { to: "/team", label: "Team HQ", icon: UsersRound },
  { to: "/documents", label: "Documents", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/milestones", label: "Milestones", icon: History },
  { to: "/investor", label: "Investor Room", icon: Eye },
] as const;

const roleLabel: Record<string, string> = {
  founder: "Founder Admin",
  team: "Team Member",
  investor: "Investor",
};

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [me, setMe] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("display_name, email").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      const role = roles?.[0]?.role ?? "team";
      setMe({
        name: profile?.display_name ?? user.email?.split("@")[0] ?? "User",
        email: profile?.email ?? user.email ?? "",
        role,
      });
    })();
    return () => { mounted = false; };
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <img src={logo.url} alt="Nabhya" className="h-9 w-9 rounded-md" />
          <div>
            <div className="font-display text-lg font-semibold leading-none">Nabhya OS</div>
            <div className="text-xs text-sidebar-foreground/60 mt-1">Single source of truth</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {nav.map((item) => {
            const active = path === item.to || (item.to !== "/" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {me && (
          <div className="m-3 rounded-lg border border-sidebar-border p-3">
            <div className="text-xs text-sidebar-foreground/60">{roleLabel[me.role] ?? me.role}</div>
            <div className="text-sm font-medium text-sidebar-foreground truncate">{me.name}</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">{me.email}</div>
            <Button size="sm" variant="ghost" className="w-full mt-2 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        )}
      </aside>
      <main className="flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-card">
          <img src={logo.url} alt="Nabhya" className="h-7 w-7 rounded" />
          <span className="font-display font-semibold">Nabhya OS</span>
        </div>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow, title, description, action,
}: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <div className="text-xs font-medium uppercase tracking-widest text-brand-green mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}
