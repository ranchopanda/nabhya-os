import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { activityLogQuery, type ActivityLog } from "@/lib/queries";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";

export const Route = createFileRoute("/_authenticated/history")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(activityLogQuery),
  component: HistoryPage,
});

function HistoryPage() {
  const { data: logs } = useSuspenseQuery(activityLogQuery);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("All");

  const modules = ["All", ...Array.from(new Set(logs.map((l) => l.module)))].sort();

  const filteredLogs = logs.filter((log) => {
    if (moduleFilter !== "All" && log.module !== moduleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        (log.entity_name && log.entity_name.toLowerCase().includes(q)) ||
        (log.actor_name && log.actor_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Audit Log"
          title="Activity History"
          description="Immutable record of all actions across Nabhya OS."
        />

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            placeholder="Search actions, entities, or actors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <Badge
                key={m}
                variant={moduleFilter === m ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setModuleFilter(m)}
              >
                {m}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-card">
              No activity found matching your filters.
            </div>
          ) : (
            filteredLogs.map((log) => <ActivityItem key={log.id} log={log} />)
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const date = new Date(log.created_at);

  return (
    <Card className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{log.actor_name}</span>
          <span className="text-muted-foreground text-sm">{log.action}</span>
          {log.entity_name && <span className="font-semibold text-sm">"{log.entity_name}"</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px] uppercase">
            {log.module}
          </Badge>
          <span>•</span>
          <span title={format(date, "PPpp")}>{formatDistanceToNow(date, { addSuffix: true })}</span>
        </div>
      </div>
    </Card>
  );
}
