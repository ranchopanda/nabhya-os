import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contentPosts } from "@/lib/mock-data";
import { Plus, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({ meta: [{ title: "Content Command Center · Nabhya OS" }, { name: "description", content: "Every post, every platform, every metric." }] }),
  component: Content,
});

function Content() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader eyebrow="Module 7" title="Content Command Center"
          description="Plan, publish, measure." action={<Button size="sm"><Plus className="h-4 w-4" /> New Post</Button>} />
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="p-5"><div className="text-xs text-muted-foreground">Monthly reach</div><div className="font-display text-3xl font-semibold mt-1">14.8k</div></Card>
          <Card className="p-5"><div className="text-xs text-muted-foreground">Best topic</div><div className="font-display text-lg font-semibold mt-1">IEEE Hackathon recap</div></Card>
          <Card className="p-5 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-brand-green" /><div><div className="text-xs text-muted-foreground">MoM growth</div><div className="font-display text-2xl font-semibold">+18%</div></div></Card>
        </div>
        <Card>
          {contentPosts.map((p) => (
            <div key={p.topic} className="px-5 py-4 border-b last:border-0 grid grid-cols-12 items-center gap-4">
              <div className="col-span-2"><Badge variant="outline">{p.platform}</Badge></div>
              <div className="col-span-6 font-medium">{p.topic}</div>
              <div className="col-span-2"><Badge variant="secondary">{p.status}</Badge></div>
              <div className="col-span-2 text-right text-sm">{p.reach > 0 ? p.reach.toLocaleString() : "—"}</div>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}
