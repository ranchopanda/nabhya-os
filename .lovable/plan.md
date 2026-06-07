You’re right: the app has database tables and some add dialogs, but it is not yet a coherent internal product. The biggest actual break I found is that your logged-in account has no `profile` and no `role`, so the app treats you like an investor/readonly user. That hides most “Add / Upload / Manage” actions, making it feel like there is no way to feed data.

## What I will fix

### 1. Repair account onboarding and roles
- Add a safe backend repair migration that backfills missing `profiles` and `user_roles` for existing signed-in users.
- Make sure there is always at least one `founder` admin.
- Keep roles in `user_roles` only, not profiles.
- Confirm the signup trigger creates profile + role for future users.

### 2. Add a real “Data Entry” command center
Create a clear page where the team can add all operational data from one place:

```text
Data Entry
- Add Lead
- Add Pilot
- Add Application
- Log Product Update
- Add Milestone
- Add Content Post
- Add Team Member
- Add Task
- Upload Proof
- Upload Document
```

This makes the app understandable: users do not need to hunt across scattered modules to know where data goes.

### 3. Make module pages actionable, not just displays
For each module page, keep the existing live database reads, but add obvious empty states and actions:
- CRM: add lead, edit status/details
- Pilots: add pilot, update progress/status
- Applications: add application, update stage/result
- Product Log: log product update
- Content: add content post, update status/metrics
- Team HQ: add team member
- Tasks: add task, move status
- Milestones: add milestone
- Proof Vault / Documents: upload file + metadata

### 4. Fix create/update/delete completeness
Most dialogs only do “create”. I’ll add the missing edit/delete flows so data can be maintained after entry:
- Reuse each dialog for create and edit where possible.
- Add row/card actions: Edit, Delete where roles allow it.
- Delete remains founder-only according to existing backend policy.

### 5. Make permissions visible instead of confusing
Right now if a user lacks role data, buttons simply disappear. I’ll change that to:
- Show user role clearly in the shell.
- Show a “Readonly / ask founder for edit access” state when not editable.
- If the current user is the only/no admin case, repair it through the backend migration.
- Show Members in navigation for founders.

### 6. Connect dashboard metrics to every live source
The dashboard currently uses live data but misses some sources. I’ll wire it to:
- leads
- pilots
- applications
- product updates
- tasks
- proof documents
- milestones

So the dashboard becomes a real roll-up of the internal product, not a separate static view.

### 7. Clean navigation and language
- Add “Data Entry” to the sidebar.
- Rename/organize module labels so the workflow is clear.
- Improve empty states to say exactly what data belongs there and provide the correct action button.

### 8. Validate with real signals
After implementing, I’ll verify:
- no stale `mock-data` imports remain
- account role/profile requests return data
- create buttons appear for founder/team users
- forms insert records into the backend
- dashboard updates from live records
- no runtime/server errors appear in preview logs

## Technical notes
- Backend is already present through Lovable Cloud: tables, RLS policies, storage bucket, auth, and roles exist.
- The app is broken mainly because the current user has no role/profile rows, and the frontend hides write actions based on that role.
- I will use a migration for the role/profile repair and keep the app using the existing client + RLS pattern for normal CRUD.
- I will not use mock data again.