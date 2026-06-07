import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadDialog } from "@/components/LeadDialog";
import { ProductUpdateDialog } from "@/components/ProductUpdateDialog";
import { UploadDialog } from "@/components/UploadDialog";
import { ContentDialog } from "@/components/ContentDialog";
import { ApplicationDialog } from "@/components/ApplicationDialog";
import { LinkedInDialog } from "@/components/LinkedInDialog";
import { useCurrentRole } from "@/hooks/use-current-role";
import {
  leadsQuery, pilotsQuery, milestonesQuery, productUpdatesQuery, applicationsQuery,
  linkedinSnapshotsQuery, proofDocsQuery,
  computeHealthMetrics, computeWeeklyProgress,
} from "@/lib/queries";
import {
  Plus, FileCheck2, ArrowUpRight, CheckCircle2, AlertCircle, Wrench, ShieldCheck, Megaphone, TrendingUp
} from "lucide-react";
import { Suspense } from "react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Nabhya OS · Executive Dashboard" },
      { name: "description", content: "The single source of truth for Nabhya — leads, pilots, proof, applications and milestones in one view." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(leadsQuery);
    context.queryClient.ensureQueryData(pilotsQuery);
    context.queryClient.ensureQueryData(milestonesQuery);
    context.queryClient.ensureQueryData(productUpdatesQuery);
    context.queryClient.ensureQueryData(applicationsQuery);
    context.queryClient.ensureQueryData(linkedinSnapshotsQuery);
    context.queryClient.ensureQueryData(proofDocsQuery("vault"));
  },
  component: DashboardPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="p-10 text-sm text-destructive">Failed to load: {error.message}</div>
    </AppShell>
  ),
  notFoundComponent: () => <AppShell><div className="p-10">Not found</div></AppShell>,
});

const toneClass: Record<string, string> = {
  green: "bg-brand-green/10 text-brand-green",
  lime: "bg-brand-lime/15 text-brand-green",
  yellow: "bg-brand-yellow/20 text-[oklch(0.45_0.14_80)]",
  red: "bg-brand-red/10 text-brand-red",
};

function DashboardPage() {
  const { canEdit } = useCurrentRole();
  const { data: leads } = useSuspenseQuery(leadsQuery);
  const { data: pilots } = useSuspenseQuery(pilotsQuery);
  const { data: milestones } = useSuspenseQuery(milestonesQuery);

  const dates = [
    ...(leads || []).map((x: any) => new Date(x.updated_at || x.created_at).getTime()),
    ...(pilots || []).map((x: any) => new Date(x.updated_at || x.created_at).getTime()),
    ...(milestones || []).map((x: any) => new Date(x.occurred_on).getTime()),
  ].filter(Boolean);

  const lastUpdated = dates.length > 0 ? formatDistanceToNow(Math.max(...dates)) + " ago" : null;

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Executive Dashboard"
          title="What's happening at Nabhya"
          description="Everything Anand, the team, and investors need — leads, pilots, proof and momentum — answerable in under 30 seconds."
          lastUpdated={lastUpdated}
          action={
            canEdit ? (
              <div className="flex flex-wrap gap-2">
                <LeadDialog trigger={<Button size="sm"><Plus className="h-4 w-4" /> Add Lead</Button>} />
                <LinkedInDialog trigger={<Button size="sm" variant="secondary"><TrendingUp className="h-4 w-4" /> Log Followers</Button>} />
                <ProductUpdateDialog trigger={<Button size="sm" variant="secondary"><Wrench className="h-4 w-4" /> Log Update</Button>} />
                <UploadDialog kind="vault" trigger={<Button size="sm" variant="secondary"><ShieldCheck className="h-4 w-4" /> Upload Proof</Button>} />
                <ContentDialog trigger={<Button size="sm" variant="secondary"><Megaphone className="h-4 w-4" /> Add Content</Button>} />
                <ApplicationDialog trigger={<Button size="sm" variant="secondary"><FileCheck2 className="h-4 w-4" /> Add App</Button>} />
              </div>
            ) : undefined
          }
        />
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </AppShell>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

function FollowUpAlert({ leads }: { leads: any[] }) {
  const { isFounder, canEdit } = useCurrentRole();
  if (!isFounder && !canEdit) return null; // Only founder/team see CRM alerts

  const todayStr = new Date().toISOString().split("T")[0];
  const overdue = leads.filter(l => 
    l.follow_up_date && 
    l.follow_up_date <= todayStr && 
    !["Customer", "Rejected"].includes(l.status)
  );

  if (overdue.length === 0) return null;

  return (
    <Card className="mb-6 p-4 border-brand-yellow/50 bg-brand-yellow/5 flex items-start gap-3">
      <div className="bg-brand-yellow/20 p-2 rounded-full text-[oklch(0.45_0.14_80)]">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div>
        <h4 className="font-semibold text-sm">Follow-ups due ({overdue.length})</h4>
        <div className="text-xs text-muted-foreground mt-1 space-y-1">
          {overdue.map(l => (
            <div key={l.id}>
              <a href="/crm" className="font-medium hover:underline text-foreground">{l.company}</a>
              {l.next_action ? ` — ${l.next_action}` : ""} ({l.follow_up_date})
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function DashboardContent() {
  const { data: leads } = useSuspenseQuery(leadsQuery);
  const { data: pilots } = useSuspenseQuery(pilotsQuery);
  const { data: milestones } = useSuspenseQuery(milestonesQuery);
  const { data: productUpdates } = useSuspenseQuery(productUpdatesQuery);
  const { data: applications } = useSuspenseQuery(applicationsQuery);
  const { data: linkedinSnapshots } = useSuspenseQuery(linkedinSnapshotsQuery);
  const { data: proofDocs } = useSuspenseQuery(proofDocsQuery("vault"));

  const metrics = computeHealthMetrics(leads, pilots, applications, linkedinSnapshots, proofDocs);
  const weekly = computeWeeklyProgress(leads, productUpdates, applications);
  const recentLeads = leads.slice(0, 5);
  const topPilots = pilots.slice(0, 3);
  const upcomingMilestones = milestones.slice(0, 4);

  return (
    <>
      <FollowUpAlert leads={leads} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4 shadow-[var(--shadow-card)] border-border/60">
            <div className="text-xs font-medium text-muted-foreground">{m.label}</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="font-display text-3xl font-semibold tracking-tight">{m.value}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${toneClass[m.tone]}`}>
                {m.delta}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 relative overflow-hidden border-0 text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}>
          <div className="relative z-10">
            <div className="text-xs uppercase tracking-widest opacity-90">Last 7 days</div>
            <h2 className="font-display text-2xl font-semibold mt-1">Momentum check</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[
                ["Tasks completed", weekly.tasksCompleted],
                ["Features built", weekly.featuresBuilt],
                ["Leads touched", weekly.outreachSent],
                ["Applications", weekly.applicationsSubmitted],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div className="font-display text-3xl font-semibold">{v}</div>
                  <div className="text-xs opacity-85 mt-1">{k}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-brand-yellow/40 blur-3xl" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Milestones</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          {upcomingMilestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
          ) : (
            <ol className="space-y-4">
              {upcomingMilestones.map((m) => (
                <li key={m.id} className="flex gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-brand-green/40" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(m.occurred_on).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                    </div>
                    <div className="text-sm font-medium">{m.title}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Active pipeline</h3>
              <p className="text-xs text-muted-foreground">Top of mind conversations</p>
            </div>
            <Badge variant="secondary">{leads.length} total</Badge>
          </div>
          {recentLeads.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No leads yet. Add your first via "Add Lead" above.
            </div>
          ) : (
            <div className="divide-y">
              {recentLeads.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.company}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {l.contact_name ?? "—"}{l.next_action ? ` · ${l.next_action}` : ""}
                    </div>
                  </div>
                  <Badge className="bg-brand-lime/20 text-brand-green hover:bg-brand-lime/20">{l.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Pilots</h3>
          {topPilots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pilots yet.</p>
          ) : (
            <div className="space-y-4">
              {topPilots.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.organization ?? "—"}{p.end_date ? ` · ends ${p.end_date}` : ""}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${p.progress}%`, background: "var(--gradient-brand)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Latest product updates</h3>
            <span className="text-xs text-muted-foreground">{productUpdates.length} logged</span>
          </div>
          {productUpdates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No product updates logged yet.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {productUpdates.slice(0, 3).map((u) => (
                <div key={u.id} className="rounded-lg border p-4 bg-card">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
                    {new Date(u.occurred_on).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {u.category ? ` · ${u.category}` : ""}{u.owner_name ? ` · ${u.owner_name}` : ""}
                  </div>
                  <div className="font-medium mt-2">{u.feature}</div>
                  {u.impact && <div className="text-sm text-muted-foreground mt-1">{u.impact}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
