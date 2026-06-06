import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  pilotsQuery, milestonesQuery, leadsQuery, applicationsQuery, proofDocsQuery,
  computeHealthMetrics,
} from "@/lib/queries";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/investor")({
  head: () => ({ meta: [{ title: "Investor Room · Nabhya OS" }, { name: "description", content: "Read-only view: traction, team and pilot outcomes." }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pilotsQuery);
    context.queryClient.ensureQueryData(milestonesQuery);
    context.queryClient.ensureQueryData(leadsQuery);
    context.queryClient.ensureQueryData(applicationsQuery);
    context.queryClient.ensureQueryData(proofDocsQuery("vault"));
  },
  component: InvestorPage,
  errorComponent: ({ error }) => <AppShell><div className="p-10 text-sm text-destructive">Failed: {error.message}</div></AppShell>,
  notFoundComponent: () => <AppShell><div className="p-10">Not found</div></AppShell>,
});

function InvestorPage() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Module 12" title="Investor Room"
          description="A read-only window into Nabhya." />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <InvestorBody />
        </Suspense>
      </div>
    </AppShell>
  );
}

function InvestorBody() {
  const { data: pilots } = useSuspenseQuery(pilotsQuery);
  const { data: milestones } = useSuspenseQuery(milestonesQuery);
  const { data: leads } = useSuspenseQuery(leadsQuery);
  const { data: apps } = useSuspenseQuery(applicationsQuery);
  const { data: proof } = useSuspenseQuery(proofDocsQuery("vault"));
  const metrics = computeHealthMetrics(leads, pilots, apps, proof).slice(0, 4);

  return (
    <>
      <div className="rounded-2xl p-8 mb-8 text-primary-foreground relative overflow-hidden" style={{ background: "var(--gradient-brand)" }}>
        <Badge className="bg-background/20 text-primary-foreground border-0 backdrop-blur"><Eye className="h-3 w-3 mr-1" /> Read-only</Badge>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4 max-w-2xl leading-tight">
          Building the trusted ground truth for agri-AI.
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className="font-display text-3xl font-semibold mt-1">{m.value}</div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Live pilots</h3>
          {pilots.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : pilots.map((p) => (
            <div key={p.id} className="py-3 border-b last:border-0">
              <div className="flex justify-between"><span className="font-medium">{p.name}</span><Badge variant="secondary">{p.status}</Badge></div>
              <div className="text-sm text-muted-foreground">{p.organization ?? "—"}</div>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Milestones</h3>
          {milestones.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : milestones.slice(-6).reverse().map((m) => (
            <div key={m.id} className="py-2 flex justify-between gap-3">
              <span className="text-sm">{m.title}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(m.occurred_on).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
