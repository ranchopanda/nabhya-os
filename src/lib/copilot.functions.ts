import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type StoredCopilotMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Json;
};

export const getCopilotHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("copilot_messages")
      .select("id, role, parts, created_at")
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    const messages: StoredCopilotMessage[] = (data ?? []).map((row) => ({
      id: row.id as string,
      role: row.role as StoredCopilotMessage["role"],
      parts: (row.parts ?? []) as Json,
    }));
    return { messages };
  });

export const clearCopilotHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("copilot_messages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
