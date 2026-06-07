import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/nabhya-logo.asset.json";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, Rocket, ShieldCheck, Wrench, FileCheck2,
  Megaphone, UsersRound, FolderKanban, ListTodo, History, Eye, LogOut, Shield, DatabaseZap, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentRole } from "@/hooks/use-current-role";
import { GlobalSearch } from "./GlobalSearch";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["founder", "team", "investor"] },
  { to: "/data-entry", label: "Data Entry", icon: DatabaseZap, roles: ["founder", "team"] },
  { to: "/crm", label: "CRM Pipeline", icon: Users, roles: ["founder", "team"] },
  { to: "/pilots", label: "Pilots", icon: Rocket, roles: ["founder", "team", "investor"] },
  { to: "/proof", label: "Proof Vault", icon: ShieldCheck, roles: ["founder", "team", "investor"] },
  { to: "/product", label: "Product Log", icon: Wrench, roles: ["founder", "team"] },
  { to: "/applications", label: "Applications", icon: FileCheck2, roles: ["founder", "team"] },
  { to: "/content", label: "Content", icon: Megaphone, roles: ["founder", "team"] },
  { to: "/team", label: "Team HQ", icon: UsersRound, roles: ["founder", "team", "investor"] },
  { to: "/documents", label: "Documents", icon: FolderKanban, roles: ["founder", "team"] },
  { to: "/tasks", label: "Tasks", icon: ListTodo, roles: ["founder", "team"] },
  { to: "/history", label: "History Log", icon: History, roles: ["founder", "team"] },
  { to: "/milestones", label: "Milestones", icon: History, roles: ["founder", "team", "investor"] },
  { to: "/investor", label: "Investor Room", icon: Eye, roles: ["founder", "team", "investor"] },
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
  const { isFounder, role, canEdit, loading } = useCurrentRole();
  const [me, setMe] = useState<{ name: string; email: string; role: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
          {nav.filter(item => loading || item.roles.includes((role ?? me?.role ?? "investor") as any)).map((item) => {
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
          {isFounder && (
            <Link
              to="/members"
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                path.startsWith("/members")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              ].join(" ")}
            >
              <Shield className="h-4 w-4" />
              Members
            </Link>
          )}
        </nav>
        {me && (
          <div className="m-3 rounded-lg border border-sidebar-border p-3">
            <div className="text-xs text-sidebar-foreground/60">{loading ? "Checking access" : roleLabel[role ?? me.role] ?? role ?? me.role}</div>
            <div className="text-sm font-medium text-sidebar-foreground truncate">{me.name}</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">{me.email}</div>
            <div className="text-[11px] text-sidebar-foreground/60 mt-1">{canEdit ? "Can add and edit data" : "Readonly access"}</div>
            <Button size="sm" variant="ghost" className="w-full mt-2 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        )}
      </aside>
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-3">
            <img src={logo.url} alt="Nabhya" className="h-7 w-7 rounded" />
            <span className="font-display font-semibold">Nabhya OS</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        {children}
      </main>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Mobile Sticky Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex items-center justify-around p-2 pb-safe z-50">
        <Link to="/" className="flex flex-col items-center gap-1 p-2 text-muted-foreground [&.active]:text-foreground">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/crm" className="flex flex-col items-center gap-1 p-2 text-muted-foreground [&.active]:text-foreground">
          <Users className="h-5 w-5" />
          <span className="text-[10px] font-medium">CRM</span>
        </Link>
        <Link to="/tasks" className="flex flex-col items-center gap-1 p-2 text-muted-foreground [&.active]:text-foreground">
          <ListTodo className="h-5 w-5" />
          <span className="text-[10px] font-medium">Tasks</span>
        </Link>
        {isFounder && (
          <Link to="/history" className="flex flex-col items-center gap-1 p-2 text-muted-foreground [&.active]:text-foreground">
            <History className="h-5 w-5" />
            <span className="text-[10px] font-medium">History</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow, title, description, action, lastUpdated
}: { eyebrow?: string; title: string; description?: string; action?: ReactNode; lastUpdated?: string | null }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <div className="text-xs font-medium uppercase tracking-widest text-brand-green mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            {description}
            {lastUpdated && <span className="ml-2 text-xs opacity-70">• Updated {lastUpdated}</span>}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
