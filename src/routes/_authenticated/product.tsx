import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productUpdates } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/product")({
  head: () => ({ meta: [{ title: "Product Log · Nabhya OS" }, { name: "description", content: "Weekly feature shipping log across AI, frontend, backend, and research." }] }),
  component: Product,
});

const extended = [
  ...productUpdates,
  { date: "May 28", feature: "Annotation API", category: "Backend", owner: "Anand", impact: "10x faster labeling" },
  { date: "May 25", feature: "Drone ingest pipeline", category: "AI", owner: "Anand", impact: "Multi-source ready" },
];

function Product() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Module 5" title="Product Development Log"
          description="What we shipped, who shipped it, and why it matters."
          action={<Button size="sm"><Plus className="h-4 w-4" /> Log Update</Button>} />
        <Card>
          {extended.map((u) => (
            <div key={u.feature + u.date} className="px-5 py-4 border-b last:border-0 grid grid-cols-12 items-center gap-4">
              <div className="col-span-2 text-sm text-muted-foreground">{u.date}</div>
              <div className="col-span-5">
                <div className="font-medium">{u.feature}</div>
                <div className="text-sm text-muted-foreground">{u.impact}</div>
              </div>
              <div className="col-span-3"><Badge variant="secondary">{u.category}</Badge></div>
              <div className="col-span-2 text-sm">{u.owner}</div>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}
