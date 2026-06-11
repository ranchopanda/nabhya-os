# Invite-only access for Nabhya OS

Turn Nabhya OS into a closed, single-organisation workspace. Only founders can let new people in, and every invite is locked to one email, one role, one use, with an expiry.

## What changes for users

- Public sign-up form is removed. The `/auth` page only shows **Sign in** (email/password + Google).
- A new founder-only page **Members → Invites** lets a founder:
  - Enter an email + role (founder / team / investor) + expiry (default 7 days).
  - Get a one-time invite link to copy, and optionally email it to the recipient.
  - See pending / accepted / expired / revoked invites and revoke any pending one.
- An invitee opens the link → lands on `/auth?invite=<token>`:
  - Page is locked to that invite's email (email field pre-filled, read-only).
  - They can either create a password or continue with Google.
  - Google sign-in is gated: if the Google account email doesn't match the invite email, sign-in is rejected and the session is cleared.
  - On success, the invite is marked `accepted`, the user gets exactly the role baked into the invite, and they land on the dashboard.
- Existing accounts: keep founders only. All other existing `team`/`investor` users are revoked (their `user_roles` rows removed and their auth accounts disabled). They'll need a fresh invite to come back.
- Everyone signed in is part of the single Nabhya org — no separate orgs/tenants. Each person still sees only what their role allows (existing RLS already covers this).

## Technical plan

### 1. Database (one migration)

- New `public.invites` table:
  - `id uuid pk`, `email citext not null`, `role app_role not null`,
  - `token_hash text not null unique` (we store SHA-256 of the token, never the raw token),
  - `invited_by uuid references auth.users`, `created_at`, `expires_at timestamptz not null`,
  - `status text` in (`pending`,`accepted`,`revoked`,`expired`) default `pending`,
  - `accepted_by uuid`, `accepted_at timestamptz`.
  - GRANTs for `authenticated` + `service_role`; RLS: only founders can `SELECT`/`INSERT`/`UPDATE`. No anon access.
- Trigger `handle_new_user` is rewritten:
  - Look up a `pending`, non-expired invite where `lower(email) = lower(NEW.email)`.
  - If none → raise exception (blocks signup at the DB level — belt & suspenders).
  - If found → insert profile, insert `user_roles(role = invite.role)`, mark invite `accepted`.
  - Remove the current "first user becomes founder" logic (founders are seeded once, see step 5).
- Helper SQL function `consume_invite(token text, user_id uuid, email text)` (SECURITY DEFINER) used by the Google-sign-in server fn to validate + mark accepted in one shot.

### 2. Supabase Auth config

- Call `configure_auth` with `disable_signup: true`. All account creation goes through server functions that use the admin client (`supabaseAdmin.auth.admin.createUser` / `inviteUserByEmail`), so public `signUp()` is closed off.

### 3. Server functions (`src/lib/invites.functions.ts`)

All gated by `requireSupabaseAuth` + founder role check (`has_role`):

- `createInvite({ email, role, expiresInDays })` → generates random 32-byte token, stores SHA-256 hash, returns raw token + URL (`/auth?invite=<token>`) once.
- `listInvites()` → for the Members → Invites table.
- `revokeInvite({ id })` → sets `status = 'revoked'`.
- `resendInvite({ id })` → regenerates token (new hash, new expiry).

Public (no auth required, but token-validated) server functions in `src/lib/invite-redeem.functions.ts`:

- `validateInvite({ token })` → returns `{ email, role, valid }` so the auth page can lock the email field.
- `redeemInviteWithPassword({ token, password })` → admin-creates user with that email + role, marks invite accepted, returns session for client to set.
- `redeemInviteWithGoogle({ token, googleEmail, userId })` → called right after Google OAuth returns; verifies emails match, assigns role, marks invite accepted. If mismatch → sign the user out and delete the just-created auth row.

### 4. UI

- `src/routes/auth.tsx`: remove the "Create an account" toggle. If `?invite=<token>` is present, call `validateInvite`, lock the email field, and show a "You're joining Nabhya OS as <role>" banner. Google button uses the same gating flow.
- `src/routes/_authenticated/members.tsx`: add an **Invites** section above the members table with a "New invite" dialog (email, role, expiry) and a list with Copy link / Email / Revoke actions.
- `src/components/AppShell.tsx`: no nav change (Members already founder-only).

### 5. Cleanup of existing public accounts

A one-shot migration step (idempotent SQL inside the same migration) that:
- Deletes `user_roles` rows where role ∈ (`team`,`investor`).
- Marks those `auth.users` as banned via `auth.admin.updateUserById({ ban_duration: 'none' })` is not SQL-safe, so we expose a founder-only server fn `purgeNonFounders()` the founder runs once from the Members page (a single button "Revoke all non-founders"). It loops with the admin client and deletes auth users not in `user_roles` with role `founder`.

### 6. Optional email delivery

For "Email the invite", use Lovable's built-in transactional email (needs email domain setup). If the founder hasn't set one up yet, the "Copy link" path still works — we'll only prompt for email domain setup the first time they click "Send email".

## Files touched

- `supabase/migrations/<new>.sql` — invites table, trigger rewrite, helper functions, RLS, GRANTs.
- `src/lib/invites.functions.ts` (new)
- `src/lib/invite-redeem.functions.ts` (new)
- `src/routes/auth.tsx` — invite-locked sign-in only.
- `src/routes/_authenticated/members.tsx` — invites UI + purge button.
- `src/integrations/supabase/...` — regenerated types after migration.

Want me to also wire up email delivery now (requires setting up an email domain), or start without it and add later?
