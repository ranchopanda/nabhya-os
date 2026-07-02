import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listComments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ entity_type: z.string(), entity_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: comments, error } = await context.supabase
      .from("comments")
      .select("*")
      .eq("entity_type", data.entity_type)
      .eq("entity_id", data.entity_id)
      .order("created_at");
    if (error) throw new Error(error.message);
    const authorIds = Array.from(new Set((comments ?? []).map((c) => c.author_id)));
    const { data: authors } = authorIds.length
      ? await context.supabase.from("profiles").select("id, display_name, email").in("id", authorIds)
      : { data: [] as any[] };
    const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
    return (comments ?? []).map((c) => ({
      ...c,
      author: authorMap.get(c.author_id) ?? null,
    }));
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        entity_type: z.string().max(60),
        entity_id: z.string().uuid(),
        entity_label: z.string().max(200).optional(),
        body: z.string().min(1).max(4000),
        mention_user_ids: z.array(z.string().uuid()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const mentions = data.mention_user_ids ?? [];
    const { data: row, error } = await context.supabase
      .from("comments")
      .insert({
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        author_id: context.userId,
        body: data.body,
        mentions,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Fanout notifications to mentioned users (excluding self)
    if (mentions.length) {
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", context.userId)
        .maybeSingle();
      const actorName = profile?.display_name ?? profile?.email ?? "Someone";
      const label = data.entity_label ?? data.entity_type;
      const notifs = mentions
        .filter((uid) => uid !== context.userId)
        .map((uid) => ({
          recipient_id: uid,
          kind: "mention",
          title: `${actorName} mentioned you`,
          body: `on ${label}: ${data.body.slice(0, 200)}`,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          actor_id: context.userId,
        }));
      if (notifs.length) await context.supabase.from("notifications").insert(notifs);
    }
    return row;
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("comments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
