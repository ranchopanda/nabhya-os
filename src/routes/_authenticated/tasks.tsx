import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks · Nabhya OS" }, { name: "description", content: "Kanban for the Nabhya team." }] }),
  component: Tasks,
});

const columns = {
  Backlog: ["Draft DST grant outline", "Prep IIM Bangalore deck"],
  "This Week": ["Send Mahindra pilot proposal", "Ship mobile dashboard v1"],
  "In Progress": ["SSIM v2 benchmark run", "Cisco interview prep"],
  Review: ["Pilot KPI dashboard"],
  Done: ["IEEE submission", "May product newsletter"],
};

function Tasks() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Module 10" title="Tasks" description="A simple Kanban — backlog to done."
          action={<Button size="sm"><Plus className="h-4 w-4" /> New Task</Button>} />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(columns).map(([col, items]) => (
            <div key={col}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">{col}</h3>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2 min-h-32">
                {items.map((t) => (
                  <Card key={t} className="p-3 text-sm hover:shadow-[var(--shadow-card)] transition-shadow cursor-pointer">{t}</Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
