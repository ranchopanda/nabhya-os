import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDailyBrief = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400_000).toISOString();

    const [overdue, stale, myTasks, behindPilots, teamShipped] = await Promise.all([
      context.supabase
        .from("leads")
        .select("id, company, next_action, follow_up_date, status")
        .lt("follow_up_date", today)
        .not("status", "in", "(Customer,Lost)")
        .order("follow_up_date")
        .limit(20),
      context.supabase
        .from("leads")
        .select("id, company, status, updated_at")
        .lt("updated_at", twoWeeksAgo)
        .not("status", "in", "(Customer,Lost)")
        .order("updated_at")
        .limit(20),
      context.supabase
        .from("tasks")
        .select("id, title, status, due_date")
        .eq("assignee_id", context.userId)
        .not("status", "eq", "Done")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(20),
      context.supabase
        .from("pilots")
        .select("id, name, organization, status, progress, end_date")
        .lt("end_date", today)
        .not("status", "eq", "Completed")
        .order("end_date")
        .limit(10),
      context.supabase
        .from("activity_events")
        .select("action, entity_label, actor_name, created_at")
        .gt("created_at", new Date(Date.now() - 86400_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    return {
      generated_at: new Date().toISOString(),
      overdue_follow_ups: overdue.data ?? [],
      stale_leads: stale.data ?? [],
      my_open_tasks: myTasks.data ?? [],
      behind_pilots: behindPilots.data ?? [],
      recent_team_activity: teamShipped.data ?? [],
    };
  });
