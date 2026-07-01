
## Goal

Right now Copilot is **read-only**. You want it to behave like a data operator: when you or a team member type a free-form update (like the Himanshi briefing), Copilot should extract who/what/when, ask focused questions only for missing CRM fields, then write to leads, activities, tasks, pilots, milestones, applications, team members, and product updates — no fluff, no "let me plan your outreach", no strategy advice.

## What Copilot will do

1. Read natural-language updates from team members ("Anand briefing Himanshi", "Himanshi finished call with Multiplex Drone", etc.).
2. Detect intent + entities: which module (lead / task / pilot / activity / member / milestone / application / product update), which record (existing or new), who it concerns (assignee, team member).
3. If a lead/company/person is mentioned, look it up first. If not found, propose creating it.
4. Ask only the questions needed to fill required CRM fields — nothing else.
5. On confirmation, write to the database and reply with a one-line receipt like: `✓ Lead "Multiplex Drone" updated → status: Contacted, next action: Send follow-up, assigned: Himanshi`.
6. Never give sales advice, outreach plans, or coaching. Silent on strategy; loud on data.

## Write tools to add to `src/routes/api/chat.ts`

All use the user-scoped `supabase` client (RLS + role check). Every tool returns `{ ok, id, summary }` or `{ needs, question }` when info is missing.

- `findLead({ query })` — fuzzy match existing leads before create.
- `upsertLead({ id?, company, contact_name?, designation?, email?, phone?, category?, status?, next_action?, follow_up_date?, notes? })`
- `logLeadActivity({ lead_id, type, note, occurred_on? })` — call, email, meeting, note.
- `updateLeadStatus({ lead_id, status, next_action?, follow_up_date? })` — shortcut.
- `upsertTask({ id?, title, status?, due_date?, assignee_id?, notes? })` — resolves assignee by team-member name.
- `upsertPilot({ id?, name, organization, status?, progress?, start_date?, end_date?, objectives?, results? })`
- `upsertApplication({ id?, name, organizer, category?, date_applied?, stage?, result?, remarks? })`
- `addMilestone({ title, description?, occurred_on?, category? })`
- `addProductUpdate({ feature, description?, impact?, category?, owner_name?, occurred_on? })`
- `upsertTeamMember({ id?, name, role?, responsibilities?, current_focus?, wins_this_month? })`
- `resolveTeamMember({ name })` — resolves "Himanshi" / "Anand" to a team_members row + user_id for assignments.

All writes are gated by role: only `founder` or `team` can write (matches existing `can_edit()` DB function). Investors get read-only behavior as today.

## New system prompt (data-operator mode)

Replace the current prompt with rules like:

- You are a **CRM data operator**, not an advisor. Never suggest outreach, strategy, next steps, or messaging.
- When the user describes an event, meeting, task, or update, extract structured fields and write them via tools.
- Always call `findLead` / list tools before creating a new record — never duplicate.
- If the update mentions a person by first name ("Himanshi", "Anand"), call `resolveTeamMember` to identify them.
- Ask **only** for missing required CRM fields, one short question at a time (e.g. "Which company was this call with?").
- Never ask about strategy, tone, timing, or opinion.
- After writing, reply with a compact receipt (module, record, fields changed). No commentary.
- If the message is pure knowledge/context (like the Himanshi guide), do **not** dump it into records. Ask: "Save this as a note against a specific lead / pilot / team member, or ignore?"

## UI touch (`src/routes/_authenticated/copilot.tsx`)

- Update the empty-state suggestion chips to data-operator prompts:
  - "Logged a call with Multiplex Drone today — they want a demo next week"
  - "Himanshi sent 20 cold emails this week, 3 responses"
  - "Move Fuselage Innovations to Meeting Scheduled, follow up on the 5th"
  - "New pilot started with AvironiX Drones, wheat field, Punjab"
- Rename header description to "Your CRM data operator. Tell me what happened — I'll update the system."
- Tool-call rendering already shows inputs/outputs, which acts as an audit trail.

## Out of scope

- No new tables, no schema migration — all writes hit existing tables.
- No changes to auth, roles, or RLS.
- No bulk import UI; conversational only.
- No sales coaching / strategy generation (explicitly disabled).

## Files touched

- `src/routes/api/chat.ts` — new system prompt + ~10 write tools.
- `src/routes/_authenticated/copilot.tsx` — new suggestion chips + header copy.
