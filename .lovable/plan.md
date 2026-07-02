
# Private Spaces + Team Comms + Smarter Copilot

Turn the OS into a workspace where every member has a hidden personal area, the team sees a live pulse of what's happening, and Copilot proactively surfaces work — with every write undoable.

## 1. Private Member Space (`/me`)

New route `src/routes/_authenticated/me.tsx` — four tabs, all scoped to `auth.uid()`. Founders can view any member's space via `/me/$userId` (read-only toggle).

- **Notes** — markdown scratchpad, autosave, pinnable
- **Personal Tasks** — separate from team tasks, due dates, quick-add
- **Watchlist** — starred leads/pilots; personal mini-dashboard (my pipeline, my follow-ups this week)
- **Private Copilot Thread** — second conversation, only reads the member's own data + notes (separate from team Copilot)

New tables (all with `owner_id uuid` + RLS `owner_id = auth.uid() OR has_role(auth.uid(),'founder')`):
- `private_notes` (title, body, pinned, updated_at)
- `personal_tasks` (title, status, due_date, notes)
- `watchlist` (entity_type: lead|pilot, entity_id) — unique per owner
- `private_copilot_messages` (mirrors `copilot_messages` but scoped to owner; conversation_id column)

## 2. Team Comms

### Activity Feed (`/pulse`)
New route showing real-time stream of everything that happened: leads created/moved, tasks completed, pilots updated, uploads, Copilot writes. Reads from a new unified `activity_events` table, populated by triggers on core tables + Copilot tool calls. Filter by member, module, date.

### Comments on Records
New `comments` table (entity_type, entity_id, author_id, body, mentions uuid[]). Add a `<CommentThread>` panel to Lead, Pilot, Task, Application, Milestone detail views. `@mention` autocomplete from team_members — mentions create notifications.

### Notifications Center
New `notifications` table + bell icon in AppShell header with unread count. Types: mention, task assigned, follow-up due, Copilot action on your record, comment reply. Click → deep link to record. Realtime via Supabase channel.

## 3. Smarter Copilot

### Proactive Daily Brief
On first Copilot open each day (or via `/pulse`), Copilot posts a personalized brief:
- Overdue follow-ups on your leads
- Stale leads (no activity 14+ days)
- Your tasks due today/overdue
- Pilots behind schedule
- What the team shipped yesterday

Built as a `getDailyBrief` server function that Copilot calls automatically on new-session detection.

### Cross-Record Intelligence
Add tools to `src/routes/api/chat.ts`:
- `findStaleLeads({ days })` — leads with no activity in N days
- `findOverdueFollowUps({ ownerId? })` — follow_up_date past
- `findBehindPilots()` — pilots where progress < expected by end_date
- `getMemberWorkload({ userId })` — open tasks, active leads, pilot count
- `findGaps()` — leads without next_action, pilots without milestones, applications without follow-up

### Undo & Audit Trail
Every Copilot write already runs through tool calls — extend each write tool to also insert into `copilot_audit_log` (tool_name, user_id, entity_type, entity_id, before_json, after_json, action_id). New `/copilot/history` view lists last 100 actions per member with an **Undo** button that restores `before_json` (or deletes if action was insert). Undo window: 24h.

## 4. Privacy Model

- Private spaces: RLS `owner_id = auth.uid() OR has_role(auth.uid(),'founder')`
- Notifications: recipient-only + founder
- Comments: visible to all team/founder (not investors)
- DMs: **not included** (you didn't select them)

## 5. Small UX upgrades

- AppShell: add unread notification bell + "My Space" nav link
- Lead/Pilot rows: add star button (adds to watchlist)
- Global command palette (⌘K): jump to any record, "New note", "New personal task"

## Technical breakdown

**Migrations** (single batch):
- `private_notes`, `personal_tasks`, `watchlist`, `private_copilot_messages`
- `comments`, `notifications`, `activity_events`, `copilot_audit_log`
- Triggers on `leads`, `pilots`, `tasks`, `applications`, `milestones`, `product_updates` → insert into `activity_events`
- Realtime publication for `notifications`, `activity_events`, `comments`
- All tables: proper GRANTs + RLS per role matrix

**Server functions** (`src/lib/`):
- `notes.functions.ts`, `personal-tasks.functions.ts`, `watchlist.functions.ts`
- `comments.functions.ts` (with mention parsing → notifications insert)
- `notifications.functions.ts` (list, markRead, markAllRead)
- `copilot-audit.functions.ts` (list, undo)
- `daily-brief.functions.ts`

**Copilot** (`src/routes/api/chat.ts`):
- 5 new read tools (stale/overdue/behind/workload/gaps)
- Wrap all existing write tools with audit-log inserts
- Detect new session → auto-inject daily brief as first assistant message
- Add `conversation_scope` param: `team` (default) or `private`

**Routes**:
- `src/routes/_authenticated/me.tsx` (+ `/me/$userId` for founder view)
- `src/routes/_authenticated/pulse.tsx` (activity feed)
- `src/routes/_authenticated/copilot.history.tsx` (audit + undo)
- `src/components/CommentThread.tsx`, `NotificationBell.tsx`, `StarButton.tsx`, `CommandPalette.tsx`

**Out of scope** (per your answers): 1:1 DMs, MCP connectors, opt-in sharing flow.

## Order of build

1. Migrations (tables, RLS, triggers, realtime)
2. Private space + notes/tasks/watchlist CRUD
3. Comments + notifications + bell
4. Activity feed page
5. Copilot audit wrapper + undo
6. Copilot new tools + daily brief + private thread
7. Command palette + star buttons + polish
