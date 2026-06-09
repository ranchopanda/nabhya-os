import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StoredCopilotMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  // parts is stored as JSON; the client casts to UIMessage["parts"]
  parts: unknown;
};

export const getCopilotHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ messages: StoredCopilotMessage[] }> => {
    const { data, error } = await context.supabase
      .from("copilot_messages")
      .select("id, role, parts, created_at")
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    const messages: StoredCopilotMessage[] = (data ?? []).map((row) => ({
      id: row.id as string,
      role: row.role as StoredCopilotMessage["role"],
      parts: row.parts ?? [],
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
