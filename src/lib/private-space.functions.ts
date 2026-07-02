import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---------- Notes ----------
export const listNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("private_notes")
      .select("*")
      .eq("owner_id", context.userId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().max(200).nullable().optional(),
        body: z.string().max(50000).optional(),
        pinned: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { id, ...patch } = data;
      const { data: row, error } = await context.supabase
        .from("private_notes")
        .update(patch)
        .eq("id", id)
        .eq("owner_id", context.userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("private_notes")
      .insert({ ...data, owner_id: context.userId, body: data.body ?? "" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("private_notes")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Personal tasks ----------
export const listPersonalTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("personal_tasks")
      .select("*")
      .eq("owner_id", context.userId)
      .order("status")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertPersonalTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).max(300).optional(),
        status: z.enum(["todo", "doing", "done"]).optional(),
        due_date: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { ...data };
    delete patch.id;
    if (data.status === "done") patch.completed_at = new Date().toISOString();
    if (data.status && data.status !== "done") patch.completed_at = null;

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("personal_tasks")
        .update(patch as any)
        .eq("id", data.id)
        .eq("owner_id", context.userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    if (!data.title) throw new Error("title required");
    const { data: row, error } = await context.supabase
      .from("personal_tasks")
      .insert({ ...patch, title: data.title, owner_id: context.userId } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePersonalTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("personal_tasks")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Watchlist ----------
export const listWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("watchlist")
      .select("*")
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    const items = rows ?? [];
    const leadIds = items.filter((r) => r.entity_type === "lead").map((r) => r.entity_id);
    const pilotIds = items.filter((r) => r.entity_type === "pilot").map((r) => r.entity_id);
    const [leads, pilots] = await Promise.all([
      leadIds.length
        ? context.supabase.from("leads").select("id, company, status, next_action, follow_up_date").in("id", leadIds)
        : Promise.resolve({ data: [] as any[] }),
      pilotIds.length
        ? context.supabase.from("pilots").select("id, name, organization, status, progress").in("id", pilotIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    return {
      items,
      leads: leads.data ?? [],
      pilots: pilots.data ?? [],
    };
  });

export const toggleWatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        entity_type: z.enum(["lead", "pilot", "task", "application"]),
        entity_id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("watchlist")
      .select("id")
      .eq("owner_id", context.userId)
      .eq("entity_type", data.entity_type)
      .eq("entity_id", data.entity_id)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("watchlist").delete().eq("id", existing.id);
      return { starred: false };
    }
    await context.supabase.from("watchlist").insert({
      owner_id: context.userId,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
    });
    return { starred: true };
  });
