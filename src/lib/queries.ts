import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export const leadsQuery = queryOptions({
  queryKey: ["leads"],
  queryFn: async (): Promise<Lead[]> => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Lead[];
  },
});

export const pilotsQuery = queryOptions({
  queryKey: ["pilots"],
  queryFn: async (): Promise<Pilot[]> => {
    const { data, error } = await supabase
      .from("pilots")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Pilot[];
  },
});

export const milestonesQuery = queryOptions({
  queryKey: ["milestones"],
  queryFn: async (): Promise<Milestone[]> => {
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .order("occurred_on", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Milestone[];
  },
});

export const productUpdatesQuery = queryOptions({
  queryKey: ["product_updates"],
  queryFn: async (): Promise<ProductUpdate[]> => {
    const { data, error } = await supabase
      .from("product_updates")
      .select("*")
      .order("occurred_on", { ascending: false })
      .limit(6);
    if (error) throw error;
    return (data ?? []) as ProductUpdate[];
  },
});

export const applicationsQuery = queryOptions({
  queryKey: ["applications"],
  queryFn: async (): Promise<Application[]> => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Application[];
  },
});

const WARM_STATUSES = new Set(["Replied", "Meeting Scheduled", "Pilot Discussion"]);

export function computeHealthMetrics(
  leads: Lead[],
  pilots: Pilot[],
  applications: Application[],
) {
  const warm = leads.filter((l) => WARM_STATUSES.has(l.status)).length;
  const meetings = leads.filter((l) => l.status === "Meeting Scheduled").length;
  const running = pilots.filter((p) => p.status === "Running" || p.status === "Active").length;
  const customers = leads.filter((l) => l.status === "Customer").length;
  const submitted = applications.filter(
    (a) => a.stage !== "Researching" && a.stage !== "Idea",
  ).length;
  const wins = applications.filter((a) => (a.result ?? "").toLowerCase().includes("win") || a.stage === "Won").length;

  return [
    { label: "Total Leads", value: leads.length, delta: `${warm} warm`, tone: "green" as const },
    { label: "Warm Leads", value: warm, delta: warm ? "in motion" : "build pipeline", tone: "lime" as const },
    { label: "Meetings Scheduled", value: meetings, delta: meetings ? "upcoming" : "—", tone: "yellow" as const },
    { label: "Pilots Running", value: running, delta: `${pilots.length} total`, tone: "green" as const },
    { label: "Paying Customers", value: customers, delta: customers ? "active" : "First in Q3", tone: "red" as const },
    { label: "Applications Submitted", value: submitted, delta: `${applications.length} tracked`, tone: "lime" as const },
    { label: "Awards Won", value: wins, delta: wins ? "validated" : "—", tone: "yellow" as const },
    { label: "Active Pipeline", value: leads.length - customers, delta: "in funnel", tone: "green" as const },
  ];
}

export function computeWeeklyProgress(
  leads: Lead[],
  productUpdates: ProductUpdate[],
  applications: Application[],
) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const since = weekAgo.toISOString();
  const sinceDate = weekAgo.toISOString().slice(0, 10);

  return {
    tasksCompleted: 0, // wired when tasks module connects
    featuresBuilt: productUpdates.filter((u) => u.occurred_on >= sinceDate).length,
    outreachSent: leads.filter((l) => l.updated_at >= since).length,
    applicationsSubmitted: applications.filter(
      (a) => (a.date_applied ?? "") >= sinceDate,
    ).length,
  };
}

export const LEAD_STATUSES = [
  "Cold",
  "Contacted",
  "Opened",
  "Replied",
  "Meeting Scheduled",
  "Pilot Discussion",
  "Pilot Active",
  "Customer",
] as const;

export const PILOT_STATUSES = ["Proposed", "Approved", "Running", "Completed", "Paused"] as const;
