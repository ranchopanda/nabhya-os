import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import logo from "@/assets/nabhya-logo.asset.json";
import {
  LayoutDashboard, Users, Rocket, ShieldCheck, Wrench, FileCheck2,
  Megaphone, UsersRound, FolderKanban, ListTodo, History, Eye, Sparkles
} from "lucide-react";

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

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

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
        <div className="m-3 rounded-lg border border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
          <div className="flex items-center gap-1.5 font-medium text-sidebar-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Phase 2
          </div>
          AI summaries, follow-up suggestions, and investor reports coming next.
        </div>
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
