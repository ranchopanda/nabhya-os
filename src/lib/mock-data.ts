export const healthMetrics = [
  { label: "Total Leads", value: 47, delta: "+8 this week", tone: "green" as const },
  { label: "Warm Leads", value: 12, delta: "+3", tone: "lime" as const },
  { label: "Meetings Scheduled", value: 6, delta: "2 upcoming", tone: "yellow" as const },
  { label: "Pilots Running", value: 2, delta: "1 closing soon", tone: "green" as const },
  { label: "Paying Customers", value: 0, delta: "First in Q3", tone: "red" as const },
  { label: "Applications Submitted", value: 9, delta: "+2", tone: "lime" as const },
  { label: "Awards Won", value: 3, delta: "IEEE, Pusa, MoE", tone: "yellow" as const },
  { label: "LinkedIn Growth", value: "1.4k", delta: "+18% MoM", tone: "green" as const },
];

export const weeklyProgress = {
  tasksCompleted: 23,
  featuresBuilt: 4,
  outreachSent: 38,
  applicationsSubmitted: 2,
};

export const recentLeads = [
  { company: "Mahindra AgriTech", contact: "R. Nair", status: "Meeting Scheduled", next: "Demo · Jun 10" },
  { company: "ICAR-IARI", contact: "Dr. S. Verma", status: "Pilot Discussion", next: "Proposal · Jun 8" },
  { company: "Reliance Foundation", contact: "P. Shah", status: "Replied", next: "Send deck" },
  { company: "Syngenta India", contact: "A. Iyer", status: "Contacted", next: "Follow up Jun 12" },
  { company: "Bayer CropScience", contact: "M. Khan", status: "Opened", next: "Second touch" },
];

export const pilots = [
  { name: "Wheat Disease Detection", org: "ICAR-IARI", status: "Running", end: "Aug 15", progress: 62 },
  { name: "Cotton Yield Mapping", org: "Mahindra AgriTech", status: "Approved", end: "Sep 30", progress: 18 },
  { name: "Drone Imagery QA", org: "Skylark Drones", status: "Proposed", end: "TBD", progress: 5 },
];

export const milestones = [
  { date: "Jun 2026", title: "IEEE Hackathon Win", tone: "green" },
  { date: "Jul 2026", title: "First Pilot Live · ICAR", tone: "lime" },
  { date: "Aug 2026", title: "First Paying Customer", tone: "yellow" },
  { date: "Sep 2026", title: "DST Grant Application", tone: "red" },
];

export const productUpdates = [
  { date: "Jun 4", feature: "Multi-spectral SSIM v2", category: "AI", owner: "Anand", impact: "+9% accuracy" },
  { date: "Jun 2", feature: "Field dashboard mobile view", category: "Mobile", owner: "Varshita", impact: "Field-ready" },
  { date: "May 30", feature: "Robustness benchmark suite", category: "Research", owner: "Rajan", impact: "Repeatable proof" },
];

export const applications = [
  { name: "NSRCEL Incubation", org: "IIM Bangalore", stage: "Shortlisted", date: "May 22" },
  { name: "Nidhi Prayas Grant", org: "DST", stage: "Submitted", date: "May 18" },
  { name: "Cisco Agri Challenge", org: "Cisco", stage: "Interview", date: "Jun 1" },
  { name: "Y Combinator W27", org: "YC", stage: "Preparing", date: "—" },
];

export const team = [
  { name: "Anand", role: "Founder · AI", focus: "Pilots & fundraising", wins: "IEEE win" },
  { name: "Himanshi", role: "Outreach", focus: "CRM pipeline", wins: "38 touches" },
  { name: "Rajan", role: "Research", focus: "Benchmarks", wins: "Robustness suite" },
  { name: "Varshita", role: "Applications & UI", focus: "Mobile dashboard", wins: "NSRCEL shortlist" },
];

export const contentPosts = [
  { platform: "LinkedIn", topic: "Why SSIM matters in agri-AI", status: "Published", reach: 4200 },
  { platform: "LinkedIn", topic: "IEEE Hackathon recap", status: "Published", reach: 6100 },
  { platform: "X", topic: "Pilot kickoff teaser", status: "Scheduled", reach: 0 },
  { platform: "LinkedIn", topic: "Behind the field test", status: "Draft", reach: 0 },
];
