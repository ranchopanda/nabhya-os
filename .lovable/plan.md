## Goal
Replace every remaining `mock-data.ts` reference with live Supabase data and add the create/edit flows your team needs to actually use the system day-to-day.

## Current state
- ✅ Live: Dashboard, CRM, Pilots
- ❌ Still mock: Applications, Content, Milestones, Product Log, Team HQ, Investor Room
- ❌ No upload pipeline: Proof Vault, Documents
- ❌ Read-only scaffolds: Tasks (no kanban write-back)
- ❌ No team management: can't invite teammates or assign roles

## Plan

### 1. Extend `src/lib/queries.ts` with the missing query options
Add `queryOptions` + types for: `applications`, `content_posts`, `tasks`, `team_members`, `proof_documents`, `profiles+user_roles` (members list).

### 2. Wire the 6 remaining module pages to live queries
For each: loader primes cache → `useSuspenseQuery` → empty states → search/filter where useful.
- **Applications** (`/applications`) — table grouped by stage, count per stage
- **Product Log** (`/product`) — timeline of `product_updates`
- **Content** (`/content`) — table of posts with platform/status badges and reach/likes
- **Milestones** (`/milestones`) — vertical timeline ordered by `occurred_on`
- **Team HQ** (`/team`) — cards from `team_members`
- **Investor Room** (`/investor`) — read-only roll-up: health metrics + active pilots + milestones + recent wins (reuse Dashboard queries)

### 3. Add CRUD dialogs (Founder/Team gated via `useCurrentRole`)
Reuse the `LeadDialog` / `PilotDialog` pattern:
- `ApplicationDialog`, `ContentDialog`, `MilestoneDialog`, `ProductUpdateDialog`, `TeamMemberDialog`, `TaskDialog`
- Each: shadcn `Dialog` + `react-hook-form` (or simple `useState`) + `useMutation` → invalidate query.
- Add inline edit/delete on row hover (founders only for delete) using a small `RowActions` component.

### 4. Tasks Kanban with write-back (`/tasks`)
- Columns: Backlog → In Progress → Review → Done
- Drag-and-drop status update via `@dnd-kit/core` (already common, will install if missing) — on drop, optimistic mutation updates `tasks.status`.
- "New task" dialog with assignee picker (from `profiles`).

### 5. Proof Vault + Documents file uploads
- Create Supabase Storage bucket `proof-vault` (private, RLS: authenticated read, editors write, founders delete).
- New `UploadDialog` component → `supabase.storage.from(...).upload()` → insert row into `proof_documents` with `file_path`.
- File list with signed-URL download links and category filter (Validation / Award / Media / Press).
- Documents page reuses the same upload + a `documents` table (will add via migration if you want a separate bucket, or fold into proof_documents with a `kind` field — recommend keeping them separate so Documents covers internal SOPs/decks while Proof Vault stays external-facing).

### 6. Members & roles management (founder-only)
- New `/members` route (founder-only `beforeLoad` gate).
- Lists `profiles` joined with `user_roles`; founder can change role between `founder` / `team` / `investor` and revoke.
- "Invite teammate" → sends magic-link via `supabase.auth.admin.inviteUserByEmail` from a `createServerFn` using `supabaseAdmin` (so we don't expose service role).

### 7. Dashboard polish
- Wire `weeklyProgress.tasksCompleted` once Tasks is live.
- Add real "Awards Won" count (filter `proof_documents` by `category = 'Award'`).
- Add quick-add buttons in header that open the new dialogs (Lead / Application / Proof / Product Update / Content).

### 8. Migration touch-ups
One small migration to add:
- `tasks.position` (int) for stable Kanban ordering
- `proof_documents.file_size`, `proof_documents.mime_type`
- Optional `documents` table if we keep them split
- Storage bucket + policies for `proof-vault`

### 9. Cleanup
Delete `src/lib/mock-data.ts` once nothing imports it.

## Technical notes
- All reads via TanStack Query (`ensureQueryData` + `useSuspenseQuery`) following the pattern already in `index.tsx` / `crm.tsx` / `pilots.tsx`.
- All writes via `supabase.from(...).insert/update/delete` inside `useMutation`, with `queryClient.invalidateQueries({ queryKey: [...] })` on success.
- Role gating uses the existing `useCurrentRole` hook (`canEdit`, `isFounder`).
- No new server functions needed except the invite endpoint (uses `supabaseAdmin`, must be `*.functions.ts` with admin import inside the handler).

## What I'd like to confirm before building

1. **Documents vs Proof Vault** — keep as two separate tables/buckets (Documents = internal SOPs/decks, Proof Vault = external validation), or merge into one with a category filter?
2. **Tasks DnD** — OK to add `@dnd-kit/core` (~30 KB) for the Kanban, or prefer a simpler status-select dropdown per card?
3. **Invites** — magic-link email via Supabase admin invite (requires email setup), or just a "share signup link, first roles default to Team" flow? The latter ships faster.
4. **Scope cut** — if you want to ship sooner, the must-haves for v1 internal are: Applications, Product Log, Milestones, Team HQ + Proof Vault uploads + Members. Content, Tasks DnD, and Investor Room polish could be a fast follow-up.

Reply with answers (or "all defaults: separate, dnd-kit, share-link, full scope") and I'll execute.
