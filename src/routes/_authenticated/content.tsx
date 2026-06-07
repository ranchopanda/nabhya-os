import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentDialog } from "@/components/ContentDialog";
import { contentPostsQuery } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Plus, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({ meta: [{ title: "Content Command Center · Nabhya OS" }, { name: "description", content: "Every post, every platform, every metric." }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(contentPostsQuery); },
  component: ContentPage,
  errorComponent: ({ error }) => <AppShell><div className="p-10 text-sm text-destructive">Failed: {error.message}</div></AppShell>,
  notFoundComponent: () => <AppShell><div className="p-10">Not found</div></AppShell>,
});

function ContentPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 7" title="Content Command Center" description="Plan, publish, measure."
          action={canEdit ? <ContentDialog trigger={<Button size="sm"><Plus className="h-4 w-4" /> New Post</Button>} /> : undefined}
        />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <ContentBody />
        </Suspense>
      </div>
    </AppShell>
  );
}

function ContentChart({ posts }: { posts: any[] }) {
  const published = posts.filter(p => p.status === "Published" && p.publish_date);
  
  if (published.length < 2) {
    return (
      <Card className="mb-6 p-12 flex flex-col items-center justify-center text-center text-sm text-muted-foreground h-64">
        <TrendingUp className="h-8 w-8 text-muted mb-3" />
        Not enough data yet to show growth trends. Publish more content!
      </Card>
    );
  }

  const byMonth = new Map<string, any>();
  const sorted = [...published].sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime());
  
  for (const p of sorted) {
    const d = new Date(p.publish_date);
    const label = d.toLocaleDateString(undefined, { month: "short" });
    const yearMonth = `${d.getFullYear()}-${d.getMonth()}`;
    
    if (!byMonth.has(yearMonth)) {
      byMonth.set(yearMonth, { name: label, reach: 0, likes: 0, saves: 0 });
    }
    const cur = byMonth.get(yearMonth)!;
    cur.reach += p.reach || 0;
    cur.likes += p.likes || 0;
    cur.saves += p.saves || 0;
  }

  const data = Array.from(byMonth.values());

  return (
    <Card className="mb-6 p-6">
      <h3 className="font-display text-lg font-semibold mb-6">Growth Trends</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickMargin={10} />
            <Tooltip 
              contentStyle={{ borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-card)", color: "var(--color-foreground)" }}
            />
            <Area type="monotone" dataKey="reach" stroke="var(--color-chart-1)" strokeWidth={2} fillOpacity={1} fill="url(#colorReach)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function ContentBody() {
  const { data: posts } = useSuspenseQuery(contentPostsQuery);
  const published = posts.filter((p) => p.status === "Published");
  const totalReach = published.reduce((s, p) => s + (p.reach ?? 0), 0);
  const best = [...published].sort((a, b) => (b.reach ?? 0) - (a.reach ?? 0))[0];

  return (
    <>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><div className="text-xs text-muted-foreground">Total reach</div><div className="font-display text-3xl font-semibold mt-1">{totalReach.toLocaleString()}</div></Card>
        <Card className="p-5"><div className="text-xs text-muted-foreground">Best post</div><div className="font-display text-lg font-semibold mt-1 truncate">{best?.topic ?? "—"}</div></Card>
        <Card className="p-5 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-brand-green" /><div><div className="text-xs text-muted-foreground">Published</div><div className="font-display text-2xl font-semibold">{published.length}</div></div></Card>
      </div>
      <ContentChart posts={posts} />
      <Card>
        {posts.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">No posts yet.</div>
        ) : posts.map((p) => (
          <div key={p.id} className="px-5 py-4 border-b last:border-0 grid grid-cols-12 items-center gap-4">
            <div className="col-span-2"><Badge variant="outline">{p.platform}</Badge></div>
            <div className="col-span-6 font-medium truncate">{p.topic}</div>
            <div className="col-span-2"><Badge variant="secondary">{p.status}</Badge></div>
            <div className="col-span-2 text-right text-sm">{(p.reach ?? 0) > 0 ? p.reach!.toLocaleString() : "—"}</div>
          </div>
        ))}
      </Card>
    </>
  );
}
