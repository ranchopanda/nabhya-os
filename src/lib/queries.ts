import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as DEMO from "./demo-data";

export type Lead = {
  id: string;
  company: string;
  contact_name: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  status: string;
  notes: string | null;
  next_action: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadActivity = {
  id: string;
  lead_id: string;
  actor_name: string | null;
  action: string;
  detail: string | null;
  created_at: string;
};

export type LinkedinSnapshot = {
  id: string;
  follower_count: number;
  occurred_on: string;
  created_at: string;
};

export type Pilot = {
  id: string;
  name: string;
  organization: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  objectives: string | null;
  kpis: string | null;
  results: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
};

export type Milestone = {
  id: string;
  title: string;
  description: string | null;
  occurred_on: string;
  category: string | null;
};

export type ProductUpdate = {
  id: string;
  feature: string;
  description: string | null;
  problem_solved: string | null;
  impact: string | null;
  category: string | null;
  owner_name: string | null;
  occurred_on: string;
};

export type Application = {
  id: string;
  name: string;
  organizer: string | null;
  category: string | null;
  date_applied: string | null;
  stage: string;
  result: string | null;
  remarks: string | null;
};

export type ContentPost = {
  id: string;
  platform: string;
  topic: string;
  format: string | null;
  publish_date: string | null;
  status: string;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  skills: string | null;
  linkedin: string | null;
  responsibilities: string | null;
  current_focus: string | null;
  wins_this_month: string | null;
  user_id: string | null;
};

export type ProofDoc = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  mime_type: string | null;
  kind: string;
  uploaded_by: string | null;
  created_at: string;
};

export type MemberProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  roles: string[];
};

export type ActivityLog = {
  id: string;
  actor_name: string | null;
  module: string;
  action: string;
  entity_name: string | null;
  detail: any | null;
  created_at: string;
};

export const leadsQuery = queryOptions({
  queryKey: ["leads"],
  queryFn: async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from("leads").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Lead[];
  },
});

export const pilotsQuery = queryOptions({
  queryKey: ["pilots"],
  queryFn: async (): Promise<Pilot[]> => {
    const { data, error } = await supabase.from("pilots").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Pilot[];
  },
});

export const milestonesQuery = queryOptions({
  queryKey: ["milestones"],
  queryFn: async (): Promise<Milestone[]> => {
    const { data, error } = await supabase.from("milestones").select("*").order("occurred_on", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Milestone[];
  },
});

export const productUpdatesQuery = queryOptions({
  queryKey: ["product_updates"],
  queryFn: async (): Promise<ProductUpdate[]> => {
    const { data, error } = await supabase.from("product_updates").select("*").order("occurred_on", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ProductUpdate[];
  },
});

export const applicationsQuery = queryOptions({
  queryKey: ["applications"],
  queryFn: async (): Promise<Application[]> => {
    const { data, error } = await supabase.from("applications").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Application[];
  },
});

export const contentPostsQuery = queryOptions({
  queryKey: ["content_posts"],
  queryFn: async (): Promise<ContentPost[]> => {
    const { data, error } = await supabase.from("content_posts").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ContentPost[];
  },
});

export const linkedinSnapshotsQuery = queryOptions({
  queryKey: ["linkedin_snapshots"],
  queryFn: async (): Promise<LinkedinSnapshot[]> => {
    const { data, error } = await supabase.from("linkedin_snapshots" as any).select("*").order("occurred_on", { ascending: false });
    if (error) {
      console.warn("linkedin_snapshots table may not exist yet.", error);
      return [];
    }
    return (data ?? []) as unknown as LinkedinSnapshot[];
  },
});

export const tasksQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: async (): Promise<Task[]> => {
    const { data, error } = await supabase.from("tasks").select("*").order("position", { ascending: true }).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Task[];
  },
});

export const teamMembersQuery = queryOptions({
  queryKey: ["team_members"],
  queryFn: async (): Promise<TeamMember[]> => {
    const { data, error } = await supabase.from("team_members").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as TeamMember[];
  },
});

export function proofDocsQuery(kind: "vault" | "document") {
  return queryOptions({
    queryKey: ["proof_documents", kind],
    queryFn: async (): Promise<ProofDoc[]> => {
      const { data, error } = await supabase
        .from("proof_documents")
        .select("*")
        .eq("kind", kind)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProofDoc[];
    },
  });
}

export const membersQuery = queryOptions({
  queryKey: ["members"],
  queryFn: async (): Promise<MemberProfile[]> => {
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, email, avatar_url").order("created_at", { ascending: true }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr) throw pErr;
    if (rErr) throw rErr;
    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role as string);
      rolesByUser.set(r.user_id, list);
    }
    return (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
  },
});

export const activityLogQuery = queryOptions({
  queryKey: ["activity_log"],
  queryFn: async (): Promise<ActivityLog[]> => {
    const { data, error } = await supabase.from("activity_log" as any).select("*").order("created_at", { ascending: false }).limit(200);
    if (error) {
      console.warn("activity_log table may not exist yet.", error);
      return [];
    }
    return (data ?? []) as unknown as ActivityLog[];
  },
});

export async function logActivity(module: string, action: string, entityName?: string | null, detail?: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const actorName = user?.email?.split("@")[0] ?? "System";
    await supabase.from("activity_log" as any).insert({
      actor_name: actorName,
      module,
      action,
      entity_name: entityName || null,
      detail: detail || null
    });
  } catch (err) {
    console.error("Failed to log activity", err);
  }
}

const WARM_STATUSES = new Set(["Replied", "Meeting Scheduled", "Pilot Discussion"]);

export function computeHealthMetrics(
  leads: Lead[],
  pilots: Pilot[],
  applications: Application[],
  linkedinSnapshots: LinkedinSnapshot[] = [],
  proofDocs: ProofDoc[] = [],
) {
  const warm = leads.filter((l) => WARM_STATUSES.has(l.status)).length;
  const meetings = leads.filter((l) => l.status === "Meeting Scheduled").length;
  const running = pilots.filter((p) => p.status === "Running" || p.status === "Active").length;
  const customers = leads.filter((l) => l.status === "Customer").length;
  const submitted = applications.filter((a) => a.stage !== "Researching" && a.stage !== "Idea").length;
  const awards = proofDocs.filter((d) => d.category === "Award" || d.category === "Awards").length;
  const latestLi = linkedinSnapshots[0]?.follower_count ?? 0;

  return [
    { label: "Total Leads", value: leads.length, delta: `${warm} warm`, tone: "green" as const },
    { label: "Warm Leads", value: warm, delta: warm ? "in motion" : "build pipeline", tone: "lime" as const },
    { label: "Meetings Scheduled", value: meetings, delta: meetings ? "upcoming" : "—", tone: "yellow" as const },
    { label: "Pilots Running", value: running, delta: `${pilots.length} total`, tone: "green" as const },
    { label: "Paying Customers", value: customers, delta: customers ? "active" : "First in Q3", tone: "red" as const },
    { label: "Applications Submitted", value: submitted, delta: `${applications.length} tracked`, tone: "lime" as const },
    { label: "Awards Won", value: awards, delta: awards ? "validated" : "—", tone: "yellow" as const },
    { label: "LinkedIn Followers", value: latestLi.toLocaleString(), delta: "Growth", tone: "green" as const },
  ];
}

export function computeWeeklyProgress(
  leads: Lead[],
  productUpdates: ProductUpdate[],
  applications: Application[],
  tasks: Task[] = [],
) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const since = weekAgo.toISOString();
  const sinceDate = since.slice(0, 10);

  return {
    tasksCompleted: tasks.filter((t) => t.status === "Done" && t.updated_at >= since).length,
    featuresBuilt: productUpdates.filter((u) => u.occurred_on >= sinceDate).length,
    outreachSent: leads.filter((l) => l.updated_at >= since).length,
    applicationsSubmitted: applications.filter((a) => (a.date_applied ?? "") >= sinceDate).length,
  };
}

export const LEAD_STATUSES = [
  "Cold", "Contacted", "Opened", "Replied", "Meeting Scheduled", "Pilot Discussion", "Pilot Active", "Customer",
] as const;

export const PILOT_STATUSES = ["Proposed", "Approved", "Running", "Completed", "Paused"] as const;

export const APPLICATION_STAGES = [
  "Researching", "Preparing", "Submitted", "Interview", "Shortlisted", "Selected", "Rejected",
] as const;

export const CONTENT_STATUSES = ["Idea", "Draft", "Scheduled", "Published"] as const;
export const CONTENT_PLATFORMS = ["LinkedIn", "X", "Instagram", "YouTube", "Blog", "Press"] as const;

export const TASK_STATUSES = ["Backlog", "This Week", "In Progress", "Review", "Done"] as const;

export const PROOF_CATEGORIES = ["Validation", "Award", "Competition", "Media", "Press", "Other"] as const;
export const DOCUMENT_CATEGORIES = ["Business", "Research", "Financial", "Legal", "Presentations", "Submissions"] as const;
