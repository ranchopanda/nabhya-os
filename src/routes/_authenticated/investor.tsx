import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { healthMetrics, pilots, milestones, team } from "@/lib/mock-data";
import { Eye, Download, Share2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/investor")({
  head: () => ({ meta: [{ title: "Investor Room · Nabhya OS" }, { name: "description", content: "Read-only view: deck, traction, team and pilot outcomes." }] }),
  component: Investor,
});

function Investor() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Module 12" title="Investor Room"
          description="A read-only window into Nabhya — share a single link with any investor."
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary"><Download className="h-4 w-4" /> Pitch Deck</Button>
              <Button size="sm"><Share2 className="h-4 w-4" /> Share Link</Button>
            </div>
          } />

        <div className="rounded-2xl p-8 mb-8 text-primary-foreground relative overflow-hidden"
          style={{ background: "var(--gradient-brand)" }}>
          <Badge className="bg-background/20 text-primary-foreground border-0 backdrop-blur"><Eye className="h-3 w-3 mr-1" /> Read-only</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4 max-w-2xl leading-tight">
            Building the trusted ground truth for agri-AI.
          </h2>
          <p className="mt-3 max-w-xl opacity-90">Validated benchmarks, live pilots with ICAR and Mahindra, and a team that ships every week.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {healthMetrics.slice(0, 4).map((m) => (
            <Card key={m.label} className="p-4">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="font-display text-3xl font-semibold mt-1">{m.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Live pilots</h3>
            {pilots.map((p) => (
              <div key={p.name} className="py-3 border-b last:border-0">
                <div className="flex justify-between"><span className="font-medium">{p.name}</span><Badge variant="secondary">{p.status}</Badge></div>
                <div className="text-sm text-muted-foreground">{p.org}</div>
              </div>
            ))}
          </Card>
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Milestones</h3>
            {milestones.map((m) => (
              <div key={m.title} className="py-2 flex justify-between">
                <span className="text-sm">{m.title}</span>
                <span className="text-xs text-muted-foreground">{m.date}</span>
              </div>
            ))}
          </Card>
          <Card className="lg:col-span-2 p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Team</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {team.map((t) => (
                <div key={t.name}>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
