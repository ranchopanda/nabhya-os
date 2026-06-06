import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  healthMetrics, weeklyProgress, recentLeads, pilots, milestones, productUpdates,
} from "@/lib/mock-data";
import {
  Plus, Upload, FileCheck2, Megaphone, Wrench, ArrowUpRight, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Nabhya OS · Executive Dashboard" },
      { name: "description", content: "The single source of truth for Nabhya — leads, pilots, proof, applications and milestones in one view." },
    ],
  }),
  component: Dashboard,
});

const toneClass: Record<string, string> = {
  green: "bg-brand-green/10 text-brand-green",
  lime: "bg-brand-lime/15 text-brand-green",
  yellow: "bg-brand-yellow/20 text-[oklch(0.45_0.14_80)]",
  red: "bg-brand-red/10 text-brand-red",
};

function Dashboard() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Executive Dashboard"
          title="What's happening at Nabhya"
          description="Everything Anand, the team, and investors need — leads, pilots, proof and momentum — answerable in under 30 seconds."
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm"><Plus className="h-4 w-4" /> Add Lead</Button>
              <Button size="sm" variant="secondary"><FileCheck2 className="h-4 w-4" /> Application</Button>
              <Button size="sm" variant="secondary"><Upload className="h-4 w-4" /> Proof</Button>
              <Button size="sm" variant="secondary"><Wrench className="h-4 w-4" /> Product update</Button>
              <Button size="sm" variant="secondary"><Megaphone className="h-4 w-4" /> Content</Button>
            </div>
          }
        />

        {/* Health metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {healthMetrics.map((m) => (
            <Card key={m.label} className="p-4 shadow-[var(--shadow-card)] border-border/60">
              <div className="text-xs font-medium text-muted-foreground">{m.label}</div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="font-display text-3xl font-semibold tracking-tight">{m.value}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${toneClass[m.tone]}`}>
                  {m.delta}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Weekly progress hero */}
          <Card className="lg:col-span-2 p-6 relative overflow-hidden border-0 text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}>
            <div className="relative z-10">
              <div className="text-xs uppercase tracking-widest opacity-90">This Week</div>
              <h2 className="font-display text-2xl font-semibold mt-1">Momentum check</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {[
                  ["Tasks completed", weeklyProgress.tasksCompleted],
                  ["Features built", weeklyProgress.featuresBuilt],
                  ["Outreach sent", weeklyProgress.outreachSent],
                  ["Applications", weeklyProgress.applicationsSubmitted],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <div className="font-display text-3xl font-semibold">{v}</div>
                    <div className="text-xs opacity-85 mt-1">{k}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-brand-yellow/40 blur-3xl" />
          </Card>

          {/* Milestones */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Milestones</h3>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <ol className="space-y-4">
              {milestones.map((m) => (
                <li key={m.title} className="flex gap-3">
                  <div className={`h-2 w-2 mt-2 rounded-full ${toneClass[m.tone]}`} />
                  <div>
                    <div className="text-xs text-muted-foreground">{m.date}</div>
                    <div className="text-sm font-medium">{m.title}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* Pipeline */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold">Active pipeline</h3>
                <p className="text-xs text-muted-foreground">Top of mind conversations</p>
              </div>
              <Badge variant="secondary">{recentLeads.length} live</Badge>
            </div>
            <div className="divide-y">
              {recentLeads.map((l) => (
                <div key={l.company} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.company}</div>
                    <div className="text-xs text-muted-foreground">{l.contact} · {l.next}</div>
                  </div>
                  <Badge className="bg-brand-lime/20 text-brand-green hover:bg-brand-lime/20">{l.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Pilots */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Pilots</h3>
            <div className="space-y-4">
              {pilots.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{p.org} · ends {p.end}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${p.progress}%`, background: "var(--gradient-brand)" }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Product log */}
          <Card className="lg:col-span-3 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Latest product updates</h3>
              <span className="text-xs text-muted-foreground">Week of Jun 1, 2026</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {productUpdates.map((u) => (
                <div key={u.feature} className="rounded-lg border p-4 bg-card">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
                    {u.date} · {u.category} · {u.owner}
                  </div>
                  <div className="font-medium mt-2">{u.feature}</div>
                  <div className="text-sm text-muted-foreground mt-1">{u.impact}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
