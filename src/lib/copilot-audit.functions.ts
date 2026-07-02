import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ENTITY_TABLES: Record<string, string> = {
  lead: "leads",
  pilot: "pilots",
  task: "tasks",
  application: "applications",
  milestone: "milestones",
  product_update: "product_updates",
  team_member: "team_members",
  lead_activity: "lead_activities",
};

export const listCopilotAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("copilot_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const undoCopilotAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: entry, error: fetchErr } = await context.supabase
      .from("copilot_audit_log")
      .select("*")
      .eq("id", data.id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);
    if (entry.undone_at) throw new Error("Already undone");

    const ageMs = Date.now() - new Date(entry.created_at).getTime();
    if (ageMs > 24 * 3600 * 1000) throw new Error("Undo window expired (24h)");

    const table = ENTITY_TABLES[entry.entity_type];
    if (!table) throw new Error(`Unknown entity type: ${entry.entity_type}`);

    if (entry.action === "insert" && entry.entity_id) {
      const { error } = await context.supabase.from(table as any).delete().eq("id", entry.entity_id);
      if (error) throw new Error(error.message);
    } else if (entry.action === "update" && entry.entity_id && entry.before_json) {
      const before = entry.before_json as Record<string, unknown>;
      const { id: _id, created_at: _c, updated_at: _u, ...restore } = before;
      const { error } = await context.supabase
        .from(table as any)
        .update(restore as any)
        .eq("id", entry.entity_id);
      if (error) throw new Error(error.message);
    } else if (entry.action === "delete" && entry.before_json) {
      const { error } = await context.supabase.from(table as any).insert(entry.before_json as any);
      if (error) throw new Error(error.message);
    }

    await context.supabase
      .from("copilot_audit_log")
      .update({ undone_at: new Date().toISOString() })
      .eq("id", data.id);

    return { ok: true };
  });
