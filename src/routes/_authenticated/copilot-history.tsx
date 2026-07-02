import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCopilotAudit, undoCopilotAction } from "@/lib/copilot-audit.functions";
import { formatDistanceToNow } from "date-fns";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/copilot-history")({
  component: HistoryPage,
});

function HistoryPage() {
  const fetchFn = useServerFn(listCopilotAudit);
  const undoFn = useServerFn(undoCopilotAction);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["copilot_audit"], queryFn: () => fetchFn() });

  const undo = useMutation({
    mutationFn: (id: string) => undoFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Action undone");
      qc.invalidateQueries({ queryKey: ["copilot_audit"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="px-6 py-8 max-w-3xl mx-auto w-full">
        <PageHeader
          eyebrow="Audit"
          title="Copilot History"
          description="Every write Copilot made. Undo within 24 hours."
        />
        {q.data?.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No Copilot actions yet.
          </Card>
        )}
        <div className="space-y-2">
          {q.data?.map((e: any) => {
            const canUndo = !e.undone_at && Date.now() - new Date(e.created_at).getTime() < 24 * 3600_000;
            return (
              <Card key={e.id} className="p-3 flex items-start gap-3">
                <Badge variant="secondary" className="shrink-0 text-[10px]">{e.action}</Badge>
                <div className="flex-1 min-w-0 text-sm">
                  <div>
                    <span className="font-medium">{e.tool_name}</span>{" "}
                    <span className="text-muted-foreground">on {e.entity_type}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                    {e.undone_at && <span className="ml-2 text-destructive">undone</span>}
                  </div>
                </div>
                {canUndo && (
                  <Button size="sm" variant="outline" onClick={() => undo.mutate(e.id)} disabled={undo.isPending}>
                    <Undo2 className="h-3.5 w-3.5" /> Undo
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
