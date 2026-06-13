import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type SupabaseUserClient = ReturnType<typeof createClient<Database>>;

function buildSystemPrompt(displayName: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    "You are Nabhya Copilot, the in-app AI assistant for Nabhya OS — a startup operating system covering CRM leads, pilots, tasks, applications, milestones, product updates, content posts, team members, proof documents and dashboard health.",
    `Today is ${today}. You are talking to ${displayName ?? "a team member"}.`,
    "",
    "Behaviour:",
    "- Be concise, structured, and action-oriented. Default to short paragraphs, bullet points, and small markdown tables.",
    "- Always prefer calling a tool over guessing. Pull live data instead of hallucinating numbers.",
    "- When the user asks 'how many', 'which', 'show me', 'list', 'summarize' — call the relevant tool first, then answer based on the result.",
    "- When you summarize lists, group by status/category, surface counts, and highlight what needs attention (stale, overdue, at risk).",
    "- If a tool returns nothing, say so plainly and suggest a next step.",
    "- For investor updates and reports, write in confident, founder-voice prose with concrete numbers from the tools.",
    "- Never invent IDs, emails, dates, or numbers. Never fabricate document contents.",
    "- This Phase 1 assistant is read-only. If the user asks to create, update, or delete data, explain that write tools are coming soon and tell them where in the app to do it manually.",
  ].join("\n");
}

function buildTools(supabase: SupabaseUserClient) {
  return {
    searchLeads: tool({
      description:
        "Search and list CRM leads. Optionally filter by status or a free-text query that matches company, contact name, or email.",
      inputSchema: z.object({
        query: z
          .string()
          .max(200)
          .optional()
          .describe("free-text match on company, contact, email"),
        status: z
          .string()
          .max(60)
          .optional()
          .describe("e.g. Cold, Contacted, Replied, Meeting Scheduled, Pilot Active, Customer"),
        limit: z.number().int().min(1).max(50).default(25),
      }),
      execute: async ({ query, status, limit }) => {
        let q = supabase
          .from("leads")
          .select(
            "id, company, contact_name, email, category, status, next_action, follow_up_date, updated_at",
          )
          .order("updated_at", { ascending: false })
          .limit(limit);
        if (status) q = q.eq("status", status);
        if (query) {
          const safe = query.replace(/[%,]/g, " ").trim();
          q = q.or(`company.ilike.%${safe}%,contact_name.ilike.%${safe}%,email.ilike.%${safe}%`);
        }
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, leads: data ?? [] };
      },
    }),

    listPilots: tool({
      description: "List all pilots with status, progress, dates and organization.",
      inputSchema: z.object({
        status: z.string().max(60).optional(),
      }),
      execute: async ({ status }) => {
        let q = supabase
          .from("pilots")
          .select(
            "id, name, organization, status, progress, start_date, end_date, objectives, results, updated_at",
          )
          .order("updated_at", { ascending: false })
          .limit(100);
        if (status) q = q.eq("status", status);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, pilots: data ?? [] };
      },
    }),

    listTasks: tool({
      description:
        "List tasks. Optionally filter by status (Backlog, This Week, In Progress, Review, Done).",
      inputSchema: z.object({
        status: z.string().max(60).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
      execute: async ({ status, limit }) => {
        let q = supabase
          .from("tasks")
          .select("id, title, status, due_date, assignee_id, updated_at")
          .order("position", { ascending: true })
          .limit(limit);
        if (status) q = q.eq("status", status);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, tasks: data ?? [] };
      },
    }),

    listApplications: tool({
      description: "List grant/award/competition applications with stage and result.",
      inputSchema: z.object({
        stage: z.string().max(60).optional(),
      }),
      execute: async ({ stage }) => {
        let q = supabase
          .from("applications")
          .select("id, name, organizer, category, date_applied, stage, result, remarks")
          .order("updated_at", { ascending: false })
          .limit(100);
        if (stage) q = q.eq("stage", stage);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, applications: data ?? [] };
      },
    }),

    listMilestones: tool({
      description: "List milestones in chronological order.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("milestones")
          .select("id, title, description, occurred_on, category")
          .order("occurred_on", { ascending: false })
          .limit(100);
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, milestones: data ?? [] };
      },
    }),

    listProductUpdates: tool({
      description: "List product feature updates shipped.",
      inputSchema: z.object({
        sinceDays: z.number().int().min(1).max(365).optional(),
      }),
      execute: async ({ sinceDays }) => {
        let q = supabase
          .from("product_updates")
          .select("id, feature, description, impact, category, owner_name, occurred_on")
          .order("occurred_on", { ascending: false })
          .limit(100);
        if (sinceDays) {
          const since = new Date(Date.now() - sinceDays * 86400000).toISOString().slice(0, 10);
          q = q.gte("occurred_on", since);
        }
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, updates: data ?? [] };
      },
    }),

    listContentPosts: tool({
      description: "List content posts (LinkedIn, X, Instagram, etc).",
      inputSchema: z.object({
        platform: z.string().max(40).optional(),
        status: z.string().max(40).optional(),
      }),
      execute: async ({ platform, status }) => {
        let q = supabase
          .from("content_posts")
          .select(
            "id, platform, topic, format, publish_date, status, reach, likes, comments, saves",
          )
          .order("publish_date", { ascending: false, nullsFirst: false })
          .limit(100);
        if (platform) q = q.eq("platform", platform);
        if (status) q = q.eq("status", status);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, posts: data ?? [] };
      },
    }),

    listProofDocuments: tool({
      description:
        "List proof vault documents and uploaded files. kind='vault' for proof vault items, 'document' for general documents.",
      inputSchema: z.object({
        kind: z.enum(["vault", "document"]).default("vault"),
        category: z.string().max(40).optional(),
      }),
      execute: async ({ kind, category }) => {
        let q = supabase
          .from("proof_documents")
          .select("id, title, category, description, kind, file_type, created_at")
          .eq("kind", kind)
          .order("created_at", { ascending: false })
          .limit(100);
        if (category) q = q.eq("category", category);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, docs: data ?? [] };
      },
    }),

    listTeamMembers: tool({
      description: "List team members and their roles, focus, and recent wins.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("team_members")
          .select("id, name, role, skills, responsibilities, current_focus, wins_this_month")
          .limit(50);
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, members: data ?? [] };
      },
    }),

    getDashboardSnapshot: tool({
      description:
        "Get the overall health snapshot — lead counts by status, pilot counts, customers, applications, awards, and recent activity. Use this for any 'how are we doing' or 'overview' question.",
      inputSchema: z.object({}),
      execute: async () => {
        const [leads, pilots, apps, awards, milestones, weekTasks] = await Promise.all([
          supabase.from("leads").select("status", { count: "exact" }),
          supabase.from("pilots").select("status, progress"),
          supabase.from("applications").select("stage"),
          supabase
            .from("proof_documents")
            .select("id", { count: "exact", head: true })
            .in("category", ["Award", "Awards"]),
          supabase
            .from("milestones")
            .select("id, title, occurred_on")
            .order("occurred_on", { ascending: false })
            .limit(5),
          supabase
            .from("tasks")
            .select("status")
            .gte("updated_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        ]);

        const leadsByStatus: Record<string, number> = {};
        for (const r of leads.data ?? [])
          leadsByStatus[r.status] = (leadsByStatus[r.status] ?? 0) + 1;
        const pilotsByStatus: Record<string, number> = {};
        for (const r of pilots.data ?? [])
          pilotsByStatus[r.status] = (pilotsByStatus[r.status] ?? 0) + 1;
        const appsByStage: Record<string, number> = {};
        for (const r of apps.data ?? []) appsByStage[r.stage] = (appsByStage[r.stage] ?? 0) + 1;

        return {
          totals: {
            leads: leads.count ?? leads.data?.length ?? 0,
            pilots: pilots.data?.length ?? 0,
            applications: apps.data?.length ?? 0,
            awards: awards.count ?? 0,
          },
          leadsByStatus,
          pilotsByStatus,
          applicationsByStage: appsByStage,
          recentMilestones: milestones.data ?? [],
          last7DaysTasksDone: (weekTasks.data ?? []).filter((t) => t.status === "Done").length,
        };
      },
    }),

    getRecentActivity: tool({
      description: "Get the most recent activity log entries across all modules.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await supabase
          .from("activity_log")
          .select("module, action, entity_name, actor_name, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, activity: data ?? [] };
      },
    }),
  };
}

async function authenticate(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { supabase, userId: data.claims.sub as string };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await authenticate(request);
        if (!session) return new Response("Unauthorized", { status: 401 });

        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!lovableKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: { messages?: UIMessage[]; displayName?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = body.messages;
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

        const { supabase, userId } = session;

        // Persist the latest user message (if any)
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          await supabase.from("copilot_messages").insert({
            user_id: userId,
            role: "user",
            parts: lastUser.parts as never,
          });
        }

        const gateway = createLovableAiGatewayProvider(lovableKey);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: buildSystemPrompt(body.displayName ?? null),
          messages: await convertToModelMessages(messages),
          tools: buildTools(supabase),
          stopWhen: stepCountIs(50),
          onError: ({ error }) => {
            console.error("[copilot] stream error", error);
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const lastAssistant = [...finalMessages].reverse().find((m) => m.role === "assistant");
            if (lastAssistant) {
              await supabase.from("copilot_messages").insert({
                user_id: userId,
                role: "assistant",
                parts: lastAssistant.parts as never,
              });
            }
          },
        });
      },
    },
  },
});
