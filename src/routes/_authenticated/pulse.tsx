import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listActivity } from "@/lib/activity.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pulse")({
  component: PulsePage,
});

function PulsePage() {
  const fetchFn = useServerFn(listActivity);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["activity_feed"], queryFn: () => fetchFn() });

  useEffect(() => {
    const channel = supabase
      .channel("activity_feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_events" }, () => {
        qc.invalidateQueries({ queryKey: ["activity_feed"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return (
    <AppShell>
      <div className="px-6 py-8 max-w-3xl mx-auto w-full">
        <PageHeader
          eyebrow="Team"
          title="Pulse"
          description="Live feed of what the team is doing across the OS."
        />
        {q.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {q.data?.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
            No activity yet. Actions across CRM, Pilots, Tasks and Copilot show up here.
          </Card>
        )}
        <div className="space-y-2">
          {q.data?.map((e: any) => (
            <Card key={e.id} className="p-3 flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">
                {e.entity_type}
              </Badge>
              <div className="flex-1 min-w-0 text-sm">
                <div>
                  <span className="font-medium">{e.actor_name ?? "Someone"}</span>{" "}
                  <span className="text-muted-foreground">{e.action}</span>{" "}
                  {e.entity_label && <span className="font-medium">{e.entity_label}</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  {e.source === "copilot" && <span className="ml-2 text-brand-green">via Copilot</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
