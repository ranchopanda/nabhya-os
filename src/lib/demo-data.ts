import { type Lead, type Pilot, type Milestone, type ProductUpdate, type Application, type ContentPost, type LinkedinSnapshot, type Task, type TeamMember, type ProofDoc, type MemberProfile, type ActivityLog } from "./queries";

export const MOCK_LEADS: Lead[] = [
  { id: "l1", company: "AgriCorp", contact_name: "John Doe", designation: "CEO", email: "john@agricorp.com", phone: "+1234567890", category: "Agri", status: "Meeting Scheduled", notes: "Interested in soil analysis.", next_action: "Send proposal", follow_up_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "l2", company: "FoodTech Inc", contact_name: "Jane Smith", designation: "CTO", email: "jane@foodtech.com", phone: "+0987654321", category: "Food Tech", status: "Pilot Discussion", notes: "Wants to integrate our API.", next_action: "Follow up on API keys", follow_up_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "l3", company: "GovAgri", contact_name: "Official Bob", designation: "Director", email: "bob@gov.org", phone: null, category: "Government", status: "Customer", notes: "Signed 1 year contract.", next_action: null, follow_up_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const MOCK_PILOTS: Pilot[] = [
  { id: "p1", name: "Soil Sensor V2 Beta", organization: "AgriCorp", start_date: "2026-05-01", end_date: "2026-08-01", status: "Running", objectives: "Test sensor accuracy.", kpis: "99% accuracy", results: null, progress: 40, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const MOCK_MILESTONES: Milestone[] = [
  { id: "m1", title: "Seed Funding Secured", description: "Raised $500k.", occurred_on: "2026-01-15", category: "Funding" },
  { id: "m2", title: "Product MVP Launched", description: "First version live.", occurred_on: "2026-03-20", category: "Product" },
];

export const MOCK_PRODUCT_UPDATES: ProductUpdate[] = [
  { id: "pu1", feature: "New AI Model", description: "Improved soil prediction by 15%.", problem_solved: "Low accuracy in dry regions.", impact: "+15% accuracy", category: "AI", owner_name: "Alice", occurred_on: "2026-06-01" },
  { id: "pu2", feature: "Dashboard Redesign", description: "Moved to React Start.", problem_solved: "Slow load times.", impact: "-50% load time", category: "Frontend", owner_name: "Bob", occurred_on: "2026-06-05" },
];

export const MOCK_APPLICATIONS: Application[] = [
  { id: "a1", name: "Y Combinator S26", organizer: "Y Combinator", category: "Accelerator", date_applied: "2026-04-10", stage: "Interview", result: null, remarks: "Interview next week." },
];

export const MOCK_CONTENT_POSTS: ContentPost[] = [
  { id: "c1", platform: "LinkedIn", topic: "AI in Agriculture", format: "Post", publish_date: "2026-05-20", status: "Published", reach: 5000, likes: 120, comments: 15, saves: 5 },
  { id: "c2", platform: "Twitter", topic: "Startup Journey", format: "Thread", publish_date: "2026-06-02", status: "Published", reach: 15000, likes: 450, comments: 30, saves: 100 },
];

export const MOCK_LINKEDIN_SNAPSHOTS: LinkedinSnapshot[] = [
  { id: "ls1", follower_count: 1200, occurred_on: "2026-05-01", created_at: new Date().toISOString() },
  { id: "ls2", follower_count: 1450, occurred_on: "2026-06-01", created_at: new Date().toISOString() },
];

export const MOCK_TASKS: Task[] = [
  { id: "t1", title: "Prepare YC Pitch", description: "Draft slides.", status: "In Progress", assignee_id: "tm1", due_date: "2026-06-15", position: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t2", title: "Fix API Bug", description: "Users reporting 500 errors.", status: "Todo", assignee_id: "tm2", due_date: "2026-06-09", position: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: "tm1", name: "Alice Founder", role: "CEO", skills: "BizDev, Pitching", linkedin: "linkedin.com/in/alice", responsibilities: "Fundraising", current_focus: "YC", wins_this_month: "Got interview", user_id: "bypass" },
  { id: "tm2", name: "Bob Engineer", role: "CTO", skills: "React, Node", linkedin: "linkedin.com/in/bob", responsibilities: "Engineering", current_focus: "Dashboard", wins_this_month: "Shipped v1", user_id: "user2" },
];

export const MOCK_PROOF_DOCS: ProofDoc[] = [
  { id: "pd1", title: "AgriCorp LOI", category: "LOI", description: "Letter of intent.", file_path: "path/to/loi.pdf", file_type: "pdf", file_size: 1024, mime_type: "application/pdf", kind: "vault", uploaded_by: "Alice", created_at: new Date().toISOString() },
];

export const MOCK_MEMBERS: MemberProfile[] = [
  { id: "bypass", display_name: "Alice Founder", email: "alice@example.com", avatar_url: null, roles: ["founder"] },
  { id: "user2", display_name: "Bob Engineer", email: "bob@example.com", avatar_url: null, roles: ["team"] },
];

export const MOCK_ACTIVITY_LOG: ActivityLog[] = [
  { id: "al1", actor_name: "Alice", module: "CRM", action: "Updated lead", entity_name: "AgriCorp", detail: null, created_at: new Date().toISOString() },
  { id: "al2", actor_name: "Bob", module: "Tasks", action: "Completed task", entity_name: "Fix API Bug", detail: null, created_at: new Date().toISOString() },
];
