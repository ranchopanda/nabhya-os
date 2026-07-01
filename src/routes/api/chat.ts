import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type SupabaseUserClient = ReturnType<typeof createClient<Database>>;

function buildSystemPrompt(displayName: string | null, canEdit: boolean) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    "You are Nabhya Copilot — a CRM DATA OPERATOR for the Nabhya OS. You are NOT an advisor, coach, strategist, or writer.",
    `Today is ${today}. You are talking to ${displayName ?? "a team member"}. Edit permission: ${canEdit ? "YES" : "NO (read-only)"}.`,
    "",
    "PRIMARY JOB: The user types free-form updates about what happened (calls, emails, meetings, tasks, pilots, milestones, product ships). You extract structured data and WRITE it into the correct tables using tools. That's it.",
    "",
    "STRICT RULES:",
    "- Do NOT give sales advice, outreach plans, messaging drafts, coaching, strategy, tone suggestions, opinions, or 'next steps to consider'. If the user asks for that, reply: 'I only update the system. Ask elsewhere for strategy.'",
    "- Always call `findLead` (or the relevant list tool) BEFORE creating a new record. Never create duplicates.",
    "- When the user mentions a first name (Anand, Himanshi, Rajan, etc.), call `resolveTeamMember` to identify who.",
    "- Ask ONLY for missing required CRM fields. One short question at a time. Never ask about strategy, timing, or opinion.",
    "- Dates: interpret 'today', 'yesterday', 'next Monday' relative to today. Always pass ISO YYYY-MM-DD.",
    "- After every successful write, reply with a compact one-line receipt: `✓ <Module> <name/company> → <changed fields>`. No commentary, no follow-up suggestions.",
    "- If the user pastes a long knowledge/context doc (like a playbook or guide), do NOT explode it into records. Reply: 'This looks like reference material, not an update. Attach as a note to a specific lead/pilot/member, or skip?'",
    "- For read questions ('how many leads', 'show pilots'), use the list tools and answer briefly.",
    "- Never invent IDs, emails, dates, or numbers. If a required field is missing, ask.",
    canEdit
      ? "- You HAVE write permission. Use it."
      : "- You DO NOT have write permission. Read-only. If asked to change data, say so and point them to the module page.",
  ].join("\n");
}

const LEAD_STATUSES = [
  "Cold",
  "Contacted",
  "Replied",
  "Meeting Scheduled",
  "Pilot Discussion",
  "Pilot Active",
  "Customer",
  "Lost",
];

function buildTools(supabase: SupabaseUserClient, canEdit: boolean, actorName: string | null) {
  const readTools = {
    findLead: tool({
      description:
        "Fuzzy-find existing leads by company, contact name, or email. ALWAYS call this before creating a new lead.",
      inputSchema: z.object({
        query: z.string().min(1).max(200),
      }),
      execute: async ({ query }) => {
        const safe = query.replace(/[%,]/g, " ").trim();
        const { data, error } = await supabase
          .from("leads")
          .select("id, company, contact_name, email, status, next_action, follow_up_date")
          .or(`company.ilike.%${safe}%,contact_name.ilike.%${safe}%,email.ilike.%${safe}%`)
          .limit(10);
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, leads: data ?? [] };
      },
    }),

    resolveTeamMember: tool({
      description:
        "Resolve a first name or partial name to a team member (returns id and user_id for task assignment).",
      inputSchema: z.object({ name: z.string().min(1).max(80) }),
      execute: async ({ name }) => {
        const safe = name.replace(/[%,]/g, " ").trim();
        const { data, error } = await supabase
          .from("team_members")
          .select("id, name, role, user_id")
          .ilike("name", `%${safe}%`)
          .limit(5);
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, members: data ?? [] };
      },
    }),

    searchLeads: tool({
      description: "List CRM leads. Filter by status or free-text query.",
      inputSchema: z.object({
        query: z.string().max(200).optional(),
        status: z.string().max(60).optional(),
        limit: z.number().int().min(1).max(50).default(25),
      }),
      execute: async ({ query, status, limit }) => {
        let q = supabase
          .from("leads")
          .select("id, company, contact_name, email, status, next_action, follow_up_date, updated_at")
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
      description: "List pilots.",
      inputSchema: z.object({ status: z.string().max(60).optional() }),
      execute: async ({ status }) => {
        let q = supabase
          .from("pilots")
          .select("id, name, organization, status, progress, start_date, end_date")
          .order("updated_at", { ascending: false })
          .limit(100);
        if (status) q = q.eq("status", status);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, pilots: data ?? [] };
      },
    }),

    listTasks: tool({
      description: "List tasks.",
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

    listTeamMembers: tool({
      description: "List all team members.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("team_members")
          .select("id, name, role, current_focus, user_id")
          .limit(50);
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, members: data ?? [] };
      },
    }),

    getDashboardSnapshot: tool({
      description: "Overall health snapshot — counts by status across leads, pilots, applications.",
      inputSchema: z.object({}),
      execute: async () => {
        const [leads, pilots, apps] = await Promise.all([
          supabase.from("leads").select("status"),
          supabase.from("pilots").select("status"),
          supabase.from("applications").select("stage"),
        ]);
        const leadsByStatus: Record<string, number> = {};
        for (const r of leads.data ?? []) leadsByStatus[r.status] = (leadsByStatus[r.status] ?? 0) + 1;
        const pilotsByStatus: Record<string, number> = {};
        for (const r of pilots.data ?? []) pilotsByStatus[r.status] = (pilotsByStatus[r.status] ?? 0) + 1;
        const appsByStage: Record<string, number> = {};
        for (const r of apps.data ?? []) appsByStage[r.stage] = (appsByStage[r.stage] ?? 0) + 1;
        return {
          totals: {
            leads: leads.data?.length ?? 0,
            pilots: pilots.data?.length ?? 0,
            applications: apps.data?.length ?? 0,
          },
          leadsByStatus,
          pilotsByStatus,
          applicationsByStage: appsByStage,
        };
      },
    }),
  };

  if (!canEdit) return readTools;

  const writeTools = {
    upsertLead: tool({
      description:
        "Create or update a CRM lead. Pass `id` to update; omit `id` to create. `company` is required for create. Use LEAD_STATUSES: Cold, Contacted, Replied, Meeting Scheduled, Pilot Discussion, Pilot Active, Customer, Lost.",
      inputSchema: z.object({
        id: z.string().uuid().optional(),
        company: z.string().max(200).optional(),
        contact_name: z.string().max(120).nullable().optional(),
        designation: z.string().max(120).nullable().optional(),
        email: z.string().max(200).nullable().optional(),
        phone: z.string().max(60).nullable().optional(),
        category: z.string().max(60).nullable().optional(),
        status: z.string().max(60).optional(),
        notes: z.string().max(4000).nullable().optional(),
        next_action: z.string().max(500).nullable().optional(),
        follow_up_date: z.string().max(10).nullable().optional().describe("ISO YYYY-MM-DD"),
      }),
      execute: async (input) => {
        if (input.id) {
          const { id, ...patch } = input;
          const { data, error } = await supabase.from("leads").update(patch).eq("id", id).select().single();
          if (error) return { error: error.message };
          return { ok: true, id: data.id, action: "updated", company: data.company };
        }
        if (!input.company) return { error: "company is required to create a lead" };
        const { data, error } = await supabase
          .from("leads")
          .insert({ ...input, company: input.company })
          .select()
          .single();
        if (error) return { error: error.message };
        return { ok: true, id: data.id, action: "created", company: data.company };
      },
    }),

    logLeadActivity: tool({
      description: "Log an activity (call, email, meeting, note) against a lead. Requires lead_id and action.",
      inputSchema: z.object({
        lead_id: z.string().uuid(),
        action: z.string().max(120).describe("e.g. Call, Email sent, Meeting, Note, Follow-up"),
        detail: z.string().max(2000).nullable().optional(),
      }),
      execute: async ({ lead_id, action, detail }) => {
        const { data, error } = await supabase
          .from("lead_activities")
          .insert({ lead_id, action, detail: detail ?? null, actor_name: actorName })
          .select()
          .single();
        if (error) return { error: error.message };
        return { ok: true, id: data.id, action: "logged" };
      },
    }),

    upsertTask: tool({
      description:
        "Create or update a task. Statuses: Backlog, This Week, In Progress, Review, Done. Pass assignee_user_id (from resolveTeamMember.user_id) to assign.",
      inputSchema: z.object({
        id: z.string().uuid().optional(),
        title: z.string().max(200).optional(),
        description: z.string().max(2000).nullable().optional(),
        status: z.string().max(40).optional(),
        due_date: z.string().max(10).nullable().optional().describe("ISO YYYY-MM-DD"),
        assignee_user_id: z.string().uuid().nullable().optional(),
      }),
      execute: async (input) => {
        const { assignee_user_id, id, title, ...rest } = input;
        const base: Record<string, string | number | null> = {};
        for (const [k, v] of Object.entries(rest)) if (v !== undefined) base[k] = v as string | number | null;
        if (assignee_user_id !== undefined) base.assignee_id = assignee_user_id;
        if (id) {
          const { data, error } = await supabase
            .from("tasks")
            .update(base as never)
            .eq("id", id)
            .select()
            .single();
          if (error) return { error: error.message };
          return { ok: true, id: data.id, action: "updated", title: data.title };
        }
        if (!title) return { error: "title is required to create a task" };
        const { data, error } = await supabase
          .from("tasks")
          .insert({ ...(base as never), title })
          .select()
          .single();
        if (error) return { error: error.message };
        return { ok: true, id: data.id, action: "created", title: data.title };
      },
    }),

    upsertPilot: tool({
      description: "Create or update a pilot.",
      inputSchema: z.object({
        id: z.string().uuid().optional(),
        name: z.string().max(200).optional(),
        organization: z.string().max(200).optional(),
        status: z.string().max(60).optional(),
        progress: z.number().int().min(0).max(100).optional(),
        start_date: z.string().max(10).nullable().optional(),
        end_date: z.string().max(10).nullable().optional(),
        objectives: z.string().max(2000).nullable().optional(),
        results: z.string().max(2000).nullable().optional(),
      }),
      execute: async (input) => {
        if (input.id) {
          const { id, ...patch } = input;
          const { data, error } = await supabase.from("pilots").update(patch).eq("id", id).select().single();
          if (error) return { error: error.message };
          return { ok: true, id: data.id, action: "updated", name: data.name };
        }
        if (!input.name || !input.organization)
          return { error: "name and organization required to create a pilot" };
        const { data, error } = await supabase
          .from("pilots")
          .insert({ ...input, name: input.name, organization: input.organization })
          .select()
          .single();
        if (error) return { error: error.message };
        return { ok: true, id: data.id, action: "created", name: data.name };
      },
    }),

    upsertApplication: tool({
      description: "Create or update a grant/award/competition application.",
      inputSchema: z.object({
        id: z.string().uuid().optional(),
        name: z.string().max(200).optional(),
        organizer: z.string().max(200).nullable().optional(),
        category: z.string().max(60).nullable().optional(),
        date_applied: z.string().max(10).nullable().optional(),
        stage: z.string().max(60).optional(),
        result: z.string().max(200).nullable().optional(),
        remarks: z.string().max(2000).nullable().optional(),
      }),
      execute: async (input) => {
        if (input.id) {
          const { id, ...patch } = input;
          const { data, error } = await supabase
            .from("applications")
            .update(patch)
            .eq("id", id)
            .select()
            .single();
          if (error) return { error: error.message };
          return { ok: true, id: data.id, action: "updated", name: data.name };
        }
        if (!input.name) return { error: "name required to create an application" };
        const { data, error } = await supabase
          .from("applications")
          .insert({ ...input, name: input.name })
          .select()
          .single();
        if (error) return { error: error.message };
        return { ok: true, id: data.id, action: "created", name: data.name };
      },
    }),

    addMilestone: tool({
      description: "Add a milestone.",
      inputSchema: z.object({
        title: z.string().max(200),
        description: z.string().max(2000).nullable().optional(),
        occurred_on: z.string().max(10).optional().describe("ISO YYYY-MM-DD, defaults to today"),
        category: z.string().max(60).nullable().optional(),
      }),
      execute: async (input) => {
        const occurred_on = input.occurred_on ?? new Date().toISOString().slice(0, 10);
        const { data, error } = await supabase
          .from("milestones")
          .insert({ ...input, occurred_on })
          .select()
          .single();
        if (error) return { error: error.message };
        return { ok: true, id: data.id, action: "created", title: data.title };
      },
    }),

    addProductUpdate: tool({
      description: "Add a product/feature update that shipped.",
      inputSchema: z.object({
        feature: z.string().max(200),
        description: z.string().max(2000).nullable().optional(),
        impact: z.string().max(500).nullable().optional(),
        category: z.string().max(60).nullable().optional(),
        owner_name: z.string().max(120).nullable().optional(),
        occurred_on: z.string().max(10).optional(),
      }),
      execute: async (input) => {
        const occurred_on = input.occurred_on ?? new Date().toISOString().slice(0, 10);
        const { data, error } = await supabase
          .from("product_updates")
          .insert({ ...input, occurred_on })
          .select()
          .single();
        if (error) return { error: error.message };
        return { ok: true, id: data.id, action: "created", feature: data.feature };
      },
    }),

    upsertTeamMember: tool({
      description: "Create or update a team member profile.",
      inputSchema: z.object({
        id: z.string().uuid().optional(),
        name: z.string().max(120).optional(),
        role: z.string().max(120).nullable().optional(),
        responsibilities: z.string().max(2000).nullable().optional(),
        current_focus: z.string().max(2000).nullable().optional(),
        wins_this_month: z.string().max(2000).nullable().optional(),
      }),
      execute: async (input) => {
        if (input.id) {
          const { id, ...patch } = input;
          const { data, error } = await supabase
            .from("team_members")
            .update(patch)
            .eq("id", id)
            .select()
            .single();
          if (error) return { error: error.message };
          return { ok: true, id: data.id, action: "updated", name: data.name };
        }
        if (!input.name) return { error: "name required to create a team member" };
        const { data, error } = await supabase
          .from("team_members")
          .insert({ ...input, name: input.name })
          .select()
          .single();
        if (error) return { error: error.message };
        return { ok: true, id: data.id, action: "created", name: data.name };
      },
    }),
  };

  void LEAD_STATUSES;
  return { ...readTools, ...writeTools };
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
  const userId = data.claims.sub as string;

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (roleRows ?? []).map((r) => r.role as string);
  const canEdit = roles.includes("founder") || roles.includes("team");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", userId)
    .maybeSingle();
  const displayName = profile?.display_name ?? profile?.email ?? null;

  return { supabase, userId, canEdit, displayName };
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

        const { supabase, userId, canEdit, displayName } = session;
        const actorName = body.displayName ?? displayName;

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
          system: buildSystemPrompt(actorName, canEdit),
          messages: await convertToModelMessages(messages),
          tools: buildTools(supabase, canEdit, actorName),
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
