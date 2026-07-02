import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listWatchlist, toggleWatch } from "@/lib/private-space.functions";

export function StarButton({
  entityType,
  entityId,
}: {
  entityType: "lead" | "pilot" | "task" | "application";
  entityId: string;
}) {
  const fetchFn = useServerFn(listWatchlist);
  const toggleFn = useServerFn(toggleWatch);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my_watchlist"], queryFn: () => fetchFn() });
  const starred = q.data?.items?.some(
    (i: any) => i.entity_type === entityType && i.entity_id === entityId,
  );
  const m = useMutation({
    mutationFn: () => toggleFn({ data: { entity_type: entityType, entity_id: entityId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my_watchlist"] }),
  });

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7"
      onClick={(e) => { e.stopPropagation(); m.mutate(); }}
      aria-label={starred ? "Unstar" : "Star"}
    >
      <Star className={`h-3.5 w-3.5 ${starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
    </Button>
  );
}
