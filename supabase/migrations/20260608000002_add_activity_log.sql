-- activity_log: immutable audit trail
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_name  TEXT,                        -- who did it (email or display name)
  module      TEXT NOT NULL,               -- e.g. "CRM", "Tasks", "Pilots"
  action      TEXT NOT NULL,               -- e.g. "Created lead", "Deleted task"
  entity_name TEXT,                        -- e.g. company name, task title
  detail      JSONB,                       -- optional extra context
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS: anyone authenticated can read & insert, but NOBODY can update/delete
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read activity_log"
  ON public.activity_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Editors can insert activity_log"
  ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (app_private.can_edit(auth.uid()));

-- Intentionally no UPDATE or DELETE policies
