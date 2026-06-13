import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PilotDialog } from "@/components/PilotDialog";
import { DeleteButton } from "@/components/DeleteButton";
import { pilotsQuery } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Edit, Plus, Target, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pilots")({
  head: () => ({
    meta: [
      { title: "Pilot Tracker · Nabhya OS" },
      { name: "description", content: "Active and upcoming pilots with KPIs and outcomes." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pilotsQuery);
  },
  component: PilotsPage,
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

function PilotsPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 3"
          title="Pilot Tracker"
          description="Where Nabhya is being proven in the field."
          action={
            canEdit ? (
              <PilotDialog
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> New Pilot
                  </Button>
                }
              />
            ) : undefined
          }
        />
        <Suspense
          fallback={
            <div className="grid md:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          }
        >
          <PilotsContent />
        </Suspense>
      </div>
    </AppShell>
  );
}

function PilotsContent() {
  const { data: pilots } = useSuspenseQuery(pilotsQuery);
  const { canEdit, isFounder } = useCurrentRole();

  if (pilots.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="font-display text-lg font-semibold">No pilots yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first pilot to start tracking field deployments.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {pilots.map((p) => (
        <Card key={p.id} className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold truncate">{p.name}</h3>
              <div className="text-sm text-muted-foreground truncate">{p.organization ?? "—"}</div>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={p.status === "Running" ? "default" : "secondary"}>{p.status}</Badge>
              {canEdit ? (
                <PilotDialog
                  pilot={p}
                  trigger={
                    <Button size="icon" variant="ghost" aria-label="Edit pilot">
                      <Edit className="h-4 w-4" />
                    </Button>
                  }
                />
              ) : null}
              {isFounder ? (
                <DeleteButton table="pilots" id={p.id} queryKey={["pilots"]} label="pilot" />
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {p.end_date ? `Ends ${p.end_date}` : "Open-ended"}
            </span>
            {p.kpis && (
              <span className="flex items-center gap-1.5 truncate">
                <Target className="h-3.5 w-3.5" /> KPIs set
              </span>
            )}
          </div>
          {p.objectives && (
            <p className="text-sm text-foreground/80 mt-3 line-clamp-2">{p.objectives}</p>
          )}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{p.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${p.progress}%`, background: "var(--gradient-brand)" }}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
