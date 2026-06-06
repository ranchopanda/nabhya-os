import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductUpdateDialog } from "@/components/ProductUpdateDialog";
import { productUpdatesQuery } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/product")({
  head: () => ({ meta: [{ title: "Product Log · Nabhya OS" }, { name: "description", content: "Weekly feature shipping log." }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(productUpdatesQuery); },
  component: ProductPage,
  errorComponent: ({ error }) => <AppShell><div className="p-10 text-sm text-destructive">Failed: {error.message}</div></AppShell>,
  notFoundComponent: () => <AppShell><div className="p-10">Not found</div></AppShell>,
});

function ProductPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 5" title="Product Development Log"
          description="What we shipped, who shipped it, and why it matters."
          action={canEdit ? <ProductUpdateDialog trigger={<Button size="sm"><Plus className="h-4 w-4" /> Log Update</Button>} /> : undefined}
        />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <ProductBody />
        </Suspense>
      </div>
    </AppShell>
  );
}

function ProductBody() {
  const { data: updates } = useSuspenseQuery(productUpdatesQuery);
  return (
    <Card>
      {updates.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">No updates logged yet.</div>
      ) : updates.map((u) => (
        <div key={u.id} className="px-5 py-4 border-b last:border-0 grid grid-cols-12 items-center gap-4">
          <div className="col-span-2 text-sm text-muted-foreground">
            {new Date(u.occurred_on).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </div>
          <div className="col-span-5">
            <div className="font-medium">{u.feature}</div>
            <div className="text-sm text-muted-foreground">{u.impact ?? u.description ?? ""}</div>
          </div>
          <div className="col-span-3">{u.category && <Badge variant="secondary">{u.category}</Badge>}</div>
          <div className="col-span-2 text-sm">{u.owner_name ?? "—"}</div>
        </div>
      ))}
    </Card>
  );
}
