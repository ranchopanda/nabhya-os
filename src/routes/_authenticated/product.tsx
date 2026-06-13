import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductUpdateDialog } from "@/components/ProductUpdateDialog";
import { DeleteButton } from "@/components/DeleteButton";
import { productUpdatesQuery } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Plus, Edit } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_authenticated/product")({
  head: () => ({
    meta: [
      { title: "Product Log · Nabhya OS" },
      { name: "description", content: "Weekly feature shipping log." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productUpdatesQuery);
  },
  component: ProductPage,
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

function ProductPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 5"
          title="Product Development Log"
          description="What we shipped, who shipped it, and why it matters."
          action={
            canEdit ? (
              <ProductUpdateDialog
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> Log Update
                  </Button>
                }
              />
            ) : undefined
          }
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
  const { canEdit, isFounder } = useCurrentRole();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = ["AI", "Frontend", "Backend", "Research", "UI", "Mobile"];

  const filtered = useMemo(() => {
    if (!activeCategory) return updates;
    return updates.filter((u) => u.category === activeCategory);
  }, [updates, activeCategory]);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory(null)}
          className="rounded-full"
        >
          All
        </Button>
        {categories.map((c) => (
          <Button
            key={c}
            variant={activeCategory === c ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(activeCategory === c ? null : c)}
            className="rounded-full"
          >
            {c}
          </Button>
        ))}
      </div>
      <Card>
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No updates found.
          </div>
        ) : (
          filtered.map((u) => (
            <div
              key={u.id}
              className="px-5 py-4 border-b last:border-0 grid grid-cols-12 items-center gap-4 hover:bg-accent/40 transition-colors"
            >
              <div className="col-span-2 text-sm text-muted-foreground">
                {new Date(u.occurred_on).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="col-span-4">
                <div className="font-medium">{u.feature}</div>
                <div className="text-sm text-muted-foreground">
                  {u.impact ?? u.description ?? ""}
                </div>
              </div>
              <div className="col-span-2">
                {u.category && <Badge variant="secondary">{u.category}</Badge>}
              </div>
              <div className="col-span-2 text-sm">{u.owner_name ?? "—"}</div>
              <div className="col-span-2 flex items-center justify-end gap-1">
                {canEdit && (
                  <ProductUpdateDialog
                    update={u}
                    trigger={
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                )}
                {isFounder && (
                  <DeleteButton
                    table="product_updates"
                    id={u.id}
                    queryKey={["product_updates"]}
                    label="product update"
                  />
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
