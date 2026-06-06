import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pilots } from "@/lib/mock-data";
import { Plus, Target, Calendar } from "lucide-react";

export const Route = createFileRoute("/pilots")({
  head: () => ({ meta: [{ title: "Pilot Tracker · Nabhya OS" }, { name: "description", content: "Active and upcoming pilots with KPIs and outcomes." }] }),
  component: Pilots,
});

function Pilots() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 3"
          title="Pilot Tracker"
          description="Where Nabhya is being proven in the field."
          action={<Button size="sm"><Plus className="h-4 w-4" /> New Pilot</Button>}
        />
        <div className="grid md:grid-cols-2 gap-5">
          {pilots.map((p) => (
            <Card key={p.name} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <div className="text-sm text-muted-foreground">{p.org}</div>
                </div>
                <Badge variant={p.status === "Running" ? "default" : "secondary"}>{p.status}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Ends {p.end}</span>
                <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> 3 KPIs</span>
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{p.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: "var(--gradient-brand)" }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
