import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationDialog } from "@/components/ApplicationDialog";
import { DeleteButton } from "@/components/DeleteButton";
import { applicationsQuery, APPLICATION_STAGES } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Edit, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Application Tracker · Nabhya OS" },
      { name: "description", content: "Incubators, grants, competitions and accelerators." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(applicationsQuery);
  },
  component: AppsPage,
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

const tone: Record<string, string> = {
  Shortlisted: "bg-brand-lime/20 text-brand-green",
  Submitted: "bg-brand-yellow/30 text-[oklch(0.4_0.14_80)]",
  Interview: "bg-brand-yellow/30 text-[oklch(0.4_0.14_80)]",
  Preparing: "bg-muted text-muted-foreground",
  Selected: "bg-brand-green text-primary-foreground",
  Rejected: "bg-brand-red/15 text-brand-red",
};

function AppsPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 6"
          title="Application Tracker"
          description="Every program Nabhya is pursuing."
          action={
            canEdit ? (
              <ApplicationDialog
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> Add Application
                  </Button>
                }
              />
            ) : undefined
          }
        />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <AppsContent />
        </Suspense>
      </div>
    </AppShell>
  );
}

function AppsContent() {
  const { data: apps } = useSuspenseQuery(applicationsQuery);
  const { canEdit, isFounder } = useCurrentRole();
  const counts = new Map<string, number>();
  for (const a of apps) counts.set(a.stage, (counts.get(a.stage) ?? 0) + 1);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        {APPLICATION_STAGES.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-card"
          >
            {s} <span className="text-muted-foreground">{counts.get(s) ?? 0}</span>
          </span>
        ))}
      </div>
      <Card>
        {apps.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No applications yet.
          </div>
        ) : (
          apps.map((a) => (
            <div
              key={a.id}
              className="px-5 py-4 border-b last:border-0 grid grid-cols-12 items-center gap-4"
            >
              <div className="col-span-5">
                <div className="font-medium">{a.name}</div>
                <div className="text-sm text-muted-foreground">
                  {a.organizer ?? "—"}
                  {a.category ? ` · ${a.category}` : ""}
                </div>
              </div>
              <div className="col-span-3">
                <span className={`text-xs px-2 py-1 rounded-full ${tone[a.stage] ?? "bg-muted"}`}>
                  {a.stage}
                </span>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                {a.date_applied ? `Applied ${a.date_applied}` : "—"}
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1">
                {canEdit ? (
                  <ApplicationDialog
                    application={a}
                    trigger={
                      <Button size="icon" variant="ghost" aria-label="Edit application">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                ) : (
                  <span className="text-sm truncate">{a.result ?? a.remarks ?? ""}</span>
                )}
                {isFounder ? (
                  <DeleteButton
                    table="applications"
                    id={a.id}
                    queryKey={["applications"]}
                    label="application"
                  />
                ) : null}
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
