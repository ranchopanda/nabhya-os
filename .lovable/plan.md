# Fix "permission denied" + harden Members

## Root cause of the error

The role dropdown in Members runs **`DELETE` then `INSERT` on `user_roles` directly from the browser** (lines 67–79 of `src/routes/_authenticated/members.tsx`). RLS on `user_roles` requires `has_role(auth.uid(), 'founder')` for both. Two failure modes:

1. **Self-demotion**: a founder changing their own role deletes their founder row first → the `WITH CHECK` on the follow-up `INSERT` re-evaluates `has_role(...)`, which now sees the deleted row in the same transaction and returns false → `permission denied for table user_roles`.
2. **Race / partial failure**: if the `INSERT` fails for any reason, the user is left with **no role at all** (they get logged out of every protected route).

There is also no real "add member" button on the page today — the only way in is an invite link — so users hitting "permission denied" while trying to "add a member" are almost certainly on the role dropdown or the invite flow.

## Fixes

### 1. Move role changes to an admin server fn

New `src/lib/members.functions.ts` with:

- `setMemberRole({ userId, role })` — `requireSupabaseAuth` + founder check, then `supabaseAdmin` does the `delete + insert` atomically. Guards:
  - Block demoting the **last** founder (count founders before delete).
  - Block a founder demoting themselves unless another founder exists.
- `removeMember({ userId })` — same guards, calls `auth.admin.deleteUser`.

Wire the Members dropdown and a new "Remove" button through these fns (no more raw client writes to `user_roles`).

### 2. Tighten the invite flow

- `createInvite`: reject if a `pending`, non-expired invite already exists for that email (avoids duplicate links the founder forgets about). Also reject if a user with that email already exists.
- `resendInvite`: only allow on `pending` / `expired` / `revoked` — never on `accepted` (currently allowed, would re-arm an already-used invite).
- Surface the invite link in a copy-friendly read-only field + "Copy link" button (today it's only toast'd and stashed in `lastLink`, easy to miss).

### 3. Small UX improvements on Members page

- Show **Joined** date and **Status** (pending invite vs. active) in the members table.
- Disable the role `Select` for the row representing the current user when they're the last founder.
- Add a "Remove member" button (founder-only, disabled for self if last founder).
- Show pending invites inline with members so it's obvious who's been invited but not joined yet.
- Replace the toast-only confirmation on "Revoke all non-founders" with a typed confirmation ("type REVOKE to confirm") — it's destructive and currently one click away.

### 4. Make the error message useful

Wrap `assertFounder` so that on failure it throws `"Only founders can do this"` instead of leaking `permission denied for table ...` to the toast.

## Files

- `src/lib/members.functions.ts` _(new)_ — `setMemberRole`, `removeMember`
- `src/lib/invites.functions.ts` — duplicate-pending guard, existing-user guard, accepted-state guard, friendlier error
- `src/routes/_authenticated/members.tsx` — use the new server fns; add Remove button, last-founder guard, joined column, inline pending invites, typed-confirm for purge, persistent copy-link UI
- No DB migration required — existing RLS stays as-is; client just stops writing to `user_roles` directly.

## Open questions

1. When a founder removes a member, should we **delete the auth account** (they lose access immediately and would need a fresh invite) or just **strip their role** (they can sign in but see nothing)? Default in this plan: delete the auth account, matching how `purgeNonFounders` already works.
2. Want me to also wire **email delivery** for invites now (requires setting up a sending domain), or keep copy-link only?
