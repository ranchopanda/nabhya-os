-- lead_activities: per-lead activity timeline
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_name  TEXT,
  action      TEXT NOT NULL,
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);

-- RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read lead_activities"
  ON public.lead_activities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Editors insert lead_activities"
  ON public.lead_activities FOR INSERT TO authenticated
  WITH CHECK (app_private.can_edit(auth.uid()));

CREATE POLICY "Founders delete lead_activities"
  ON public.lead_activities FOR DELETE TO authenticated
  USING (app_private.has_role(auth.uid(), 'founder'));
