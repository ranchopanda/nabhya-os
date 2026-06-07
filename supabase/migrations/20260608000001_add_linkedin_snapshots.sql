-- linkedin_snapshots: track follower count over time
CREATE TABLE IF NOT EXISTS public.linkedin_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_count  INTEGER NOT NULL CHECK (follower_count >= 0),
  occurred_on     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.linkedin_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read linkedin_snapshots"
  ON public.linkedin_snapshots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Editors insert linkedin_snapshots"
  ON public.linkedin_snapshots FOR INSERT TO authenticated
  WITH CHECK (app_private.can_edit(auth.uid()));

CREATE POLICY "Founders delete linkedin_snapshots"
  ON public.linkedin_snapshots FOR DELETE TO authenticated
  USING (app_private.has_role(auth.uid(), 'founder'));
