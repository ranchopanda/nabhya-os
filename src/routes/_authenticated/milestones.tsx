import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MilestoneDialog } from "@/components/MilestoneDialog";
import { milestonesQuery } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/milestones")({
  head: () => ({ meta: [{ title: "Milestones · Nabhya OS" }, { name: "description", content: "The story of Nabhya, in chronological order." }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(milestonesQuery); },
  component: MilestonesPage,
  errorComponent: ({ error }) => <AppShell><div className="p-10 text-sm text-destructive">Failed: {error.message}</div></AppShell>,
  notFoundComponent: () => <AppShell><div className="p-10">Not found</div></AppShell>,
});

function MilestonesPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-3xl mx-auto">
        <PageHeader
          eyebrow="Module 11" title="Milestone Timeline"
          description="Every meaningful step the company has taken."
          action={canEdit ? <MilestoneDialog trigger={<Button size="sm"><Plus className="h-4 w-4" /> Add Milestone</Button>} /> : undefined}
        />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Timeline />
        </Suspense>
      </div>
    </AppShell>
  );
}

function Timeline() {
  const { data: milestones } = useSuspenseQuery(milestonesQuery);
  if (milestones.length === 0) return <p className="text-sm text-muted-foreground">No milestones yet.</p>;
  const colors = ["var(--brand-green)", "var(--brand-lime)", "var(--brand-yellow)", "var(--brand-red)"];
  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5" style={{ background: "var(--gradient-brand)" }} />
      {milestones.map((m, i) => (
        <div key={m.id} className="relative pb-10 last:pb-0">
          <div className="absolute -left-[22px] top-1 h-4 w-4 rounded-full border-4 border-background" style={{ background: colors[i % 4] }} />
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {new Date(m.occurred_on).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            {m.category ? ` · ${m.category}` : ""}
          </div>
          <div className="font-display text-xl font-semibold mt-1">{m.title}</div>
          {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
        </div>
      ))}
    </div>
  );
}
