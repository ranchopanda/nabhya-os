# Nabhya Copilot — AI Assistant Plan

A chat-based AI assistant embedded in Nabhya OS that can **read your data, answer questions, and take actions** across CRM, Pilots, Tasks, Documents, Content, Applications, and more. Goal: replace 80% of clicking, filtering, and form-filling with a sentence.

---

## 1. Where it lives

- **Floating Copilot button** (bottom-right) on every authenticated page — opens a side drawer chat.
- **Dedicated `/copilot` route** for full-screen conversations with thread history.
- **Inline "Ask AI" buttons** on key surfaces (Lead row, Pilot card, Document, Dashboard) that open the chat pre-scoped to that entity.
- **Cmd/Ctrl+J** keyboard shortcut to open from anywhere.

Conversation shape: **threaded** with **database persistence** (per user, RLS-scoped). Founder/team only; investors get a read-only Q&A variant.

---

## 2. What it can do (capabilities)

### A. Ask & analyze (read-only, instant value)
- "How many warm leads do we have? Which ones haven't been contacted in 2 weeks?"
- "Summarize this week's progress for an investor update."
- "Which pilot is at risk? Why?"
- "What awards have we won this quarter?"
- "Draft the LinkedIn post from this product update."
- "Who on the team has the most open tasks?"

### B. Create & update (action tools)
- **CRM**: "Add lead — Acme Corp, contact Jane (jane@acme.com), category enterprise, status Contacted."
- **Tasks**: "Create a task for me: prepare Acme pitch deck, due Friday."
- **Pilots**: "Move the BHEL pilot to Running and set progress to 40%."
- **Milestones**: "Log a milestone — closed first paying customer today."
- **Activity log**: every AI action writes to `activity_log` with actor = "Copilot (user name)".
- **Bulk edits**: "Mark all leads from last month's webinar as Cold."

### C. Document intelligence (Proof Vault & Documents)
- "Summarize this pitch deck." / "Extract key numbers from this financial PDF."
- "Find the slide where we mention our TAM."
- Auto-tag uploads with category + extracted description on upload.
- Semantic search: "Find all docs that mention ISRO."

### D. Content & outreach drafting
- "Draft a cold outreach email to this lead based on their company and our last pilot."
- "Turn this milestone into 3 LinkedIn post variants."
- "Generate a weekly newsletter from this week's activity log."

### E. Reporting & exports
- "Build an investor update for May." → renders markdown + offers PDF export.
- "Export warm leads as CSV." → triggers existing export.
- "Show me the funnel: leads → meetings → pilots → customers."

### F. Smart suggestions (proactive)
- Dashboard widget: "3 leads need follow-up", "Pilot X has no update in 14 days", "Application deadline in 3 days".
- On-open briefing: "Here's what changed since you last logged in."

---

## 3. Architecture (technical)

- **Model**: Lovable AI Gateway → `google/gemini-3-flash-preview` (fast, free-tier friendly) with fallback to `gemini-2.5-pro` for heavy reasoning/document tasks.
- **SDK**: Vercel AI SDK (`streamText`, `tool`, `stopWhen: stepCountIs(50)`).
- **Server boundary**: TanStack server route `src/routes/api/chat.ts` for streaming + per-user auth via `requireSupabaseAuth` pattern.
- **UI**: AI Elements (`Conversation`, `Message`, `MessageResponse`, `Tool`, `PromptInput`) — install via `bun x ai-elements@latest add ...`.
- **Persistence**: two new tables — `copilot_threads` and `copilot_messages` (UIMessage[] JSON), RLS-scoped to `user_id`, with proper GRANTs.

### Tool catalog (server-side, AI SDK `tool()`)
Each tool runs as the authenticated user — RLS enforces what they can see/edit. Mutating tools use `needsApproval: true` so the user confirms in chat before writing.

| Tool | Purpose |
|---|---|
| `searchLeads` / `updateLead` / `createLead` / `logLeadActivity` | CRM ops |
| `listPilots` / `updatePilot` | Pilot ops |
| `createTask` / `updateTaskStatus` / `assignTask` | Tasks |
| `createMilestone` / `createProductUpdate` | History |
| `searchDocuments` / `summarizeDocument` | Reads file via signed URL → model |
| `createContentPost` / `draftPost` | Content |
| `getDashboardMetrics` / `getWeeklyProgress` | Reuses `computeHealthMetrics` |
| `globalSearch` | Reuses existing GlobalSearch index |
| `logActivity` | Auto-called after every mutation |

Role gating: investor identity only gets read tools. Founder/team gets full set.

### Cost & guardrails
- Per-user daily message cap (configurable in `.env`).
- 429/402 surfaced as toasts (rate limit / credits exhausted).
- All tool inputs Zod-validated (length caps to prevent prompt-injection blowups).

---

## 4. Build phases

**Phase 1 — Foundation (chat works, read-only)**
- Tables + RLS, server route, AI Elements install, floating button + drawer, threaded `/copilot` route, system prompt with app context, `searchLeads` / `listPilots` / `getDashboardMetrics` / `globalSearch` tools.

**Phase 2 — Actions**
- Mutating tools with `needsApproval` confirmations, activity logging, inline "Ask AI about this lead/pilot" entry points.

**Phase 3 — Documents & drafting**
- `summarizeDocument` (PDF → text via gemini multimodal), content drafting tools, export-to-PDF for investor updates.

**Phase 4 — Proactive**
- Dashboard "AI briefing" card, daily digest, smart suggestions on stale entities.

---

## 5. Open questions before building

1. Should the assistant be available to **investors** (read-only Q&A) or **founder/team only**?
2. Phase 1 scope OK to start with, or do you want Phase 1+2 (read + write) in the first build?
3. Any specific first use-case you want bullet-proof on day one (e.g., "draft investor update" vs "manage CRM by chat")?
