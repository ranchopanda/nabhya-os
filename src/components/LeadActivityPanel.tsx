import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeadActivity } from "@/lib/queries";

export function LeadActivityPanel({ leadId }: { leadId: string }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["lead_activities", leadId],
    queryFn: async () => {
      // Return empty array if the table doesn't exist yet to prevent crashes
      const { data, error } = await supabase
        .from("lead_activities" as any)
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.warn("lead_activities table may not exist yet.", error);
        return [] as LeadActivity[];
      }
      return (data || []) as LeadActivity[];
    },
  });

  if (isLoading) return <Skeleton className="h-32 mt-4" />;
  if (!activities || activities.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Activity Timeline</h4>
      <div className="space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="flex gap-3 text-sm">
            <div className="h-2 w-2 mt-1.5 rounded-full bg-brand-green/40 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="mt-0.5">
                <span className="font-medium text-foreground">{a.actor_name}</span>{" "}
                <span className="text-muted-foreground">{a.action}</span>
              </div>
              {a.detail && <div className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">{a.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
