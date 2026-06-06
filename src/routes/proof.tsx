import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Award, FlaskConical, Newspaper, FileText } from "lucide-react";

export const Route = createFileRoute("/proof")({
  head: () => ({ meta: [{ title: "Proof Vault · Nabhya OS" }, { name: "description", content: "Evidence: validation, awards, competitions, and media." }] }),
  component: Proof,
});

const buckets = [
  { name: "Validation", icon: FlaskConical, count: 14, items: ["SSIM v2 report", "Benchmark Q2", "Robustness suite"] },
  { name: "Awards", icon: Award, count: 5, items: ["IEEE Hackathon 2026", "Pusa Krishi", "MoE Innovation Cell"] },
  { name: "Competitions", icon: FileText, count: 7, items: ["Aggnite finalist deck", "Pusa Krishi pitch"] },
  { name: "Media", icon: Newspaper, count: 9, items: ["LinkedIn feature", "Field photos · May"] },
];

function Proof() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Module 4" title="Proof Vault"
          description="The receipts — every piece of evidence that Nabhya works."
          action={<Button size="sm"><Upload className="h-4 w-4" /> Upload Proof</Button>} />
        <div className="grid md:grid-cols-2 gap-5">
          {buckets.map((b) => (
            <Card key={b.name} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-brand-lime/20 text-brand-green">
                  <b.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{b.name}</h3>
                  <div className="text-xs text-muted-foreground">{b.count} items</div>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {b.items.map((i) => (
                  <li key={i} className="flex items-center gap-2 py-2 border-b last:border-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" /> {i}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
