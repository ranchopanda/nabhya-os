import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recentLeads } from "@/lib/mock-data";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: "CRM & Lead Pipeline · Nabhya OS" }, { name: "description", content: "Track every organization Nabhya is in conversation with." }] }),
  component: CRM,
});

const stages = ["Cold", "Contacted", "Opened", "Replied", "Meeting Scheduled", "Pilot Discussion", "Pilot Active", "Customer"];

const expanded = [
  ...recentLeads,
  { company: "Tata Trusts", contact: "K. Menon", status: "Cold", next: "Intro email" },
  { company: "Olam Agri", contact: "S. Banerjee", status: "Contacted", next: "Send brief" },
  { company: "Godrej Agrovet", contact: "V. Patel", status: "Opened", next: "Schedule call" },
];

function CRM() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 2"
          title="CRM & Lead Pipeline"
          description="Every conversation Nabhya is having, end-to-end."
          action={<Button size="sm"><Plus className="h-4 w-4" /> Add Lead</Button>}
        />

        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search companies, contacts, notes…" className="border-0 focus-visible:ring-0 shadow-none" />
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stages.slice(0, 4).map((s, i) => (
            <Card key={s} className="p-4">
              <div className="text-xs text-muted-foreground">{s}</div>
              <div className="font-display text-2xl font-semibold mt-1">{[18, 12, 9, 5][i]}</div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="grid grid-cols-12 px-5 py-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Company</div>
            <div className="col-span-3">Contact</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2">Next action</div>
          </div>
          {expanded.map((l) => (
            <div key={l.company} className="grid grid-cols-12 px-5 py-4 border-b last:border-0 items-center hover:bg-accent/40 transition-colors">
              <div className="col-span-4 font-medium">{l.company}</div>
              <div className="col-span-3 text-sm text-muted-foreground">{l.contact}</div>
              <div className="col-span-3"><Badge variant="secondary">{l.status}</Badge></div>
              <div className="col-span-2 text-sm">{l.next}</div>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}
