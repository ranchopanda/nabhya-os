
-- =========================================
-- Private notes
-- =========================================
CREATE TABLE public.private_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX private_notes_owner_idx ON public.private_notes(owner_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.private_notes TO authenticated;
GRANT ALL ON public.private_notes TO service_role;
ALTER TABLE public.private_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner or founder read notes" ON public.private_notes FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'founder'));
CREATE POLICY "owner write notes" ON public.private_notes FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner update notes" ON public.private_notes FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner delete notes" ON public.private_notes FOR DELETE TO authenticated
  USING (owner_id = auth.uid());
CREATE TRIGGER private_notes_updated_at BEFORE UPDATE ON public.private_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Personal tasks
-- =========================================
CREATE TABLE public.personal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  due_date DATE,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX personal_tasks_owner_idx ON public.personal_tasks(owner_id, status, due_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_tasks TO authenticated;
GRANT ALL ON public.personal_tasks TO service_role;
ALTER TABLE public.personal_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner or founder read ptasks" ON public.personal_tasks FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'founder'));
CREATE POLICY "owner write ptasks" ON public.personal_tasks FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner update ptasks" ON public.personal_tasks FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner delete ptasks" ON public.personal_tasks FOR DELETE TO authenticated
  USING (owner_id = auth.uid());
CREATE TRIGGER personal_tasks_updated_at BEFORE UPDATE ON public.personal_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Watchlist (starred leads/pilots)
-- =========================================
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead','pilot','task','application')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, entity_type, entity_id)
);
CREATE INDEX watchlist_owner_idx ON public.watchlist(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner or founder read watch" ON public.watchlist FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'founder'));
CREATE POLICY "owner write watch" ON public.watchlist FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner delete watch" ON public.watchlist FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- =========================================
-- Comments
-- =========================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  mentions UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX comments_entity_idx ON public.comments(entity_type, entity_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read comments" ON public.comments FOR SELECT TO authenticated
  USING (public.can_edit(auth.uid()));
CREATE POLICY "team insert comments" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.can_edit(auth.uid()));
CREATE POLICY "author update comments" ON public.comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "author or founder delete comments" ON public.comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'founder'));
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Notifications
-- =========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  link TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_recipient_idx ON public.notifications(recipient_id, read_at, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipient or founder read notif" ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR public.has_role(auth.uid(), 'founder'));
CREATE POLICY "team insert notif" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "recipient update notif" ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY "recipient delete notif" ON public.notifications FOR DELETE TO authenticated
  USING (recipient_id = auth.uid());

-- =========================================
-- Activity events (team pulse)
-- =========================================
CREATE TABLE public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_label TEXT,
  detail JSONB,
  source TEXT NOT NULL DEFAULT 'app',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activity_events_created_idx ON public.activity_events(created_at DESC);
CREATE INDEX activity_events_actor_idx ON public.activity_events(actor_id, created_at DESC);
GRANT SELECT, INSERT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read activity" ON public.activity_events FOR SELECT TO authenticated
  USING (public.can_edit(auth.uid()));
CREATE POLICY "team insert activity" ON public.activity_events FOR INSERT TO authenticated
  WITH CHECK (public.can_edit(auth.uid()) AND (actor_id = auth.uid() OR actor_id IS NULL));

-- =========================================
-- Copilot audit log (undoable)
-- =========================================
CREATE TABLE public.copilot_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL CHECK (action IN ('insert','update','delete')),
  before_json JSONB,
  after_json JSONB,
  undone_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX copilot_audit_actor_idx ON public.copilot_audit_log(actor_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.copilot_audit_log TO authenticated;
GRANT ALL ON public.copilot_audit_log TO service_role;
ALTER TABLE public.copilot_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actor or founder read audit" ON public.copilot_audit_log FOR SELECT TO authenticated
  USING (actor_id = auth.uid() OR public.has_role(auth.uid(), 'founder'));
CREATE POLICY "actor insert audit" ON public.copilot_audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
CREATE POLICY "actor update audit" ON public.copilot_audit_log FOR UPDATE TO authenticated
  USING (actor_id = auth.uid()) WITH CHECK (actor_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
