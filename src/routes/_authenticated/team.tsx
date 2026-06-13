import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamMemberDialog } from "@/components/TeamMemberDialog";
import { teamMembersQuery } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team HQ · Nabhya OS" },
      { name: "description", content: "Who's on the Nabhya team." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(teamMembersQuery);
  },
  component: TeamPage,
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

function TeamPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 8"
          title="Team HQ"
          description="The humans behind Nabhya."
          action={
            canEdit ? (
              <TeamMemberDialog
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> Add Member
                  </Button>
                }
              />
            ) : undefined
          }
        />
        <Suspense fallback={<Skeleton className="h-64" />}>
          <TeamGrid />
        </Suspense>
      </div>
    </AppShell>
  );
}

function TeamGrid() {
  const { data: team } = useSuspenseQuery(teamMembersQuery);
  if (team.length === 0)
    return (
      <Card className="p-12 text-center text-sm text-muted-foreground">No team members yet.</Card>
    );
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {team.map((t) => (
        <Card key={t.id} className="p-6">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center font-display font-semibold text-lg text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            {t.name[0]}
          </div>
          <h3 className="font-display text-lg font-semibold mt-4">{t.name}</h3>
          <div className="text-sm text-muted-foreground">{t.role ?? "—"}</div>
          {t.current_focus && (
            <>
              <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">
                Focus
              </div>
              <div className="text-sm">{t.current_focus}</div>
            </>
          )}
          {t.wins_this_month && (
            <>
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                Win this month
              </div>
              <div className="text-sm">{t.wins_this_month}</div>
            </>
          )}
          {t.linkedin && (
            <a
              href={t.linkedin}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-green hover:underline mt-3 inline-block"
            >
              LinkedIn
            </a>
          )}
        </Card>
      ))}
    </div>
  );
}
