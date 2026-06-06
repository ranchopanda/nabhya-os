import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskDialog } from "@/components/TaskDialog";
import { tasksQuery, TASK_STATUSES, type Task } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks · Nabhya OS" }, { name: "description", content: "Kanban for the Nabhya team." }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(tasksQuery); },
  component: TasksPage,
  errorComponent: ({ error }) => <AppShell><div className="p-10 text-sm text-destructive">Failed: {error.message}</div></AppShell>,
  notFoundComponent: () => <AppShell><div className="p-10">Not found</div></AppShell>,
});

function TasksPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 10" title="Tasks" description="A simple Kanban — backlog to done."
          action={canEdit ? <TaskDialog trigger={<Button size="sm"><Plus className="h-4 w-4" /> New Task</Button>} /> : undefined}
        />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Board canEdit={canEdit} />
        </Suspense>
      </div>
    </AppShell>
  );
}

function Board({ canEdit }: { canEdit: boolean }) {
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const byStatus = new Map<string, Task[]>();
  for (const s of TASK_STATUSES) byStatus.set(s, []);
  for (const t of tasks) {
    if (!byStatus.has(t.status)) byStatus.set(t.status, []);
    byStatus.get(t.status)!.push(t);
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {TASK_STATUSES.map((col) => {
        const items = byStatus.get(col) ?? [];
        return (
          <div key={col}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">{col}</h3>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="space-y-2 min-h-32">
              {items.map((t) => (
                <Card key={t.id} className="p-3 text-sm">
                  <div className="font-medium">{t.title}</div>
                  {t.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</div>}
                  <div className="flex items-center justify-between mt-2 gap-2">
                    {t.due_date && <span className="text-[10px] text-muted-foreground">{t.due_date}</span>}
                    {canEdit && (
                      <Select value={t.status} onValueChange={(v) => update.mutate({ id: t.id, status: v })}>
                        <SelectTrigger className="h-6 text-[10px] w-auto ml-auto"><SelectValue /></SelectTrigger>
                        <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
