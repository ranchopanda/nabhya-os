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
import { leadsQuery, LEAD_STATUSES } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({ meta: [{ title: "CRM & Lead Pipeline · Nabhya OS" }, { name: "description", content: "Track every organization Nabhya is in conversation with." }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(leadsQuery); },
  component: CRMPage,
  errorComponent: ({ error }) => (
    <AppShell><div className="p-10 text-sm text-destructive">Failed: {error.message}</div></AppShell>
  ),
  notFoundComponent: () => <AppShell><div className="p-10">Not found</div></AppShell>,
});

function CRMPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 2"
          title="CRM & Lead Pipeline"
          description="Every conversation Nabhya is having, end-to-end."
          action={canEdit ? (
            <LeadDialog trigger={<Button size="sm"><Plus className="h-4 w-4" /> Add Lead</Button>} />
          ) : undefined}
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
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter((l) =>
      [l.company, l.contact_name, l.email, l.notes, l.next_action]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle))
    );
  }, [leads, q]);

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {LEAD_STATUSES.slice(0, 4).map((s) => (
          <Card key={s} className="p-4">
            <div className="text-xs text-muted-foreground">{s}</div>
            <div className="font-display text-2xl font-semibold mt-1">{counts.get(s) ?? 0}</div>
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
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {leads.length === 0 ? "No leads yet. Add your first lead to start tracking the pipeline." : "No leads match your search."}
          </div>
        ) : (
          filtered.map((l) => (
            <div key={l.id} className="grid grid-cols-12 px-5 py-4 border-b last:border-0 items-center hover:bg-accent/40 transition-colors">
              <div className="col-span-4 font-medium truncate">{l.company}</div>
              <div className="col-span-3 text-sm text-muted-foreground truncate">
                {l.contact_name ?? "—"}{l.email ? <span className="block text-xs">{l.email}</span> : null}
              </div>
              <div className="col-span-3"><Badge variant="secondary">{l.status}</Badge></div>
              <div className="col-span-2 text-sm truncate">{l.next_action ?? "—"}</div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
