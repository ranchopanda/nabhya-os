import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, Suspense, useMemo } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadDialog } from "@/components/LeadDialog";
import { DeleteButton } from "@/components/DeleteButton";
import { leadsQuery, LEAD_STATUSES } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { exportToCSV } from "@/lib/export";
import { Download, Edit, Plus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [
      { title: "CRM & Lead Pipeline · Nabhya OS" },
      { name: "description", content: "Track every organization Nabhya is in conversation with." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(leadsQuery);
  },
  component: CRMPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="p-10 text-sm text-destructive">Failed: {error.message}</div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="p-10">Not found</div>
    </AppShell>
  ),
});

function CRMPage() {
  const { canEdit, isFounder } = useCurrentRole();
  const { data: leads } = useSuspenseQuery(leadsQuery);

  const lastUpdated =
    leads.length > 0
      ? formatDistanceToNow(new Date(leads[0].updated_at || leads[0].created_at)) + " ago"
      : null;

  const handleExport = () => {
    exportToCSV("nabhya_leads", leads, [
      { header: "Company", key: "company" },
      { header: "Contact Name", key: "contact_name" },
      { header: "Designation", key: "designation" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phone" },
      { header: "Category", key: "category" },
      { header: "Status", key: "status" },
      { header: "Notes", key: "notes" },
      { header: "Next Action", key: "next_action" },
      { header: "Follow Up Date", key: "follow_up_date" },
    ]);
  };

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 2"
          title="CRM & Lead Pipeline"
          description="Every conversation Nabhya is having, end-to-end."
          lastUpdated={lastUpdated}
          action={
            <div className="flex gap-2">
              {isFounder && (
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              )}
              {canEdit ? (
                <LeadDialog
                  trigger={
                    <Button size="sm">
                      <Plus className="h-4 w-4" /> Add Lead
                    </Button>
                  }
                />
              ) : null}
            </div>
          }
        />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <CRMContent />
        </Suspense>
      </div>
    </AppShell>
  );
}

function CRMContent() {
  const { data: leads } = useSuspenseQuery(leadsQuery);
  const { canEdit, isFounder } = useCurrentRole();
  const [q, setQ] = useState("");
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = leads;
    if (activeStatus) {
      result = result.filter((l) => l.status === activeStatus);
    }
    const needle = q.trim().toLowerCase();
    if (needle) {
      result = result.filter((l) =>
        [l.company, l.contact_name, l.email, l.notes, l.next_action]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(needle)),
      );
    }
    return result;
  }, [leads, q, activeStatus]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leads) map.set(l.status, (map.get(l.status) ?? 0) + 1);
    return map;
  }, [leads]);

  return (
    <>
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies, contacts, notes…"
            className="border-0 focus-visible:ring-0 shadow-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeStatus === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveStatus(null)}
          className="rounded-full"
        >
          All
          <Badge
            variant="secondary"
            className="ml-2 bg-background/50 hover:bg-background/50 text-foreground"
          >
            {leads.length}
          </Badge>
        </Button>
        {LEAD_STATUSES.map((s) => (
          <Button
            key={s}
            variant={activeStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveStatus(activeStatus === s ? null : s)}
            className="rounded-full"
          >
            {s}
            <Badge
              variant="secondary"
              className="ml-2 bg-background/50 hover:bg-background/50 text-foreground"
            >
              {counts.get(s) ?? 0}
            </Badge>
          </Button>
        ))}
      </div>

      <Card>
        <div className="hidden md:grid grid-cols-12 px-5 py-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Company</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {leads.length === 0
              ? "No leads yet. Add your first lead to start tracking the pipeline."
              : "No leads match your search."}
          </div>
        ) : (
          filtered.map((l) => (
            <div
              key={l.id}
              className="flex flex-col md:grid md:grid-cols-12 px-5 py-4 border-b last:border-0 md:items-center gap-3 md:gap-0 hover:bg-accent/40 transition-colors"
            >
              <div className="md:col-span-4 font-medium truncate flex items-center justify-between">
                <span>{l.company}</span>
                <Badge variant="secondary" className="md:hidden">
                  {l.status}
                </Badge>
              </div>
              <div className="md:col-span-3 text-sm text-muted-foreground truncate">
                {l.contact_name ?? "—"}
                {l.email ? <span className="block text-xs">{l.email}</span> : null}
              </div>
              <div className="hidden md:block md:col-span-3">
                <Badge variant="secondary">{l.status}</Badge>
              </div>
              <div className="md:col-span-2 flex items-center md:justify-end gap-1 mt-2 md:mt-0">
                {canEdit ? (
                  <LeadDialog
                    lead={l}
                    trigger={
                      <Button size="icon" variant="ghost" aria-label="Edit lead">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                ) : (
                  <span className="text-sm text-muted-foreground truncate mr-auto">
                    {l.next_action ?? "—"}
                  </span>
                )}
                {isFounder ? (
                  <DeleteButton table="leads" id={l.id} queryKey={["leads"]} label="lead" />
                ) : null}
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
