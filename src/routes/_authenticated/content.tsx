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
