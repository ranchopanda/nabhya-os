import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applications } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/applications")({
  head: () => ({ meta: [{ title: "Application Tracker · Nabhya OS" }, { name: "description", content: "Incubators, grants, competitions and accelerators." }] }),
  component: Applications,
});

const stages = ["Researching", "Preparing", "Submitted", "Interview", "Shortlisted", "Selected", "Rejected"];
const tone: Record<string, string> = {
  Shortlisted: "bg-brand-lime/20 text-brand-green",
  Submitted: "bg-brand-yellow/30 text-[oklch(0.4_0.14_80)]",
  Interview: "bg-brand-yellow/30 text-[oklch(0.4_0.14_80)]",
  Preparing: "bg-muted text-muted-foreground",
  Selected: "bg-brand-green text-primary-foreground",
};

function Applications() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Module 6" title="Application Tracker"
          description="Every program Nabhya is pursuing." action={<Button size="sm"><Plus className="h-4 w-4" /> Add Application</Button>} />
        <div className="flex flex-wrap gap-2 mb-5">
          {stages.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
        </div>
        <Card>
          {applications.map((a) => (
            <div key={a.name} className="px-5 py-4 border-b last:border-0 grid grid-cols-12 items-center gap-4">
              <div className="col-span-5">
                <div className="font-medium">{a.name}</div>
                <div className="text-sm text-muted-foreground">{a.org}</div>
              </div>
              <div className="col-span-3"><span className={`text-xs px-2 py-1 rounded-full ${tone[a.stage] ?? "bg-muted"}`}>{a.stage}</span></div>
              <div className="col-span-2 text-sm text-muted-foreground">Applied {a.date}</div>
              <div className="col-span-2 text-right"><Button size="sm" variant="ghost">View</Button></div>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}
