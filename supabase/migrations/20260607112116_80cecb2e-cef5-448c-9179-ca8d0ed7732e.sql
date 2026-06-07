CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION app_private.can_edit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_private.has_role(_user_id, 'founder') OR app_private.has_role(_user_id, 'team')
$$;

GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.can_edit(uuid) TO authenticated;

ALTER POLICY "Users see own roles" ON public.user_roles
  USING (user_id = auth.uid() OR app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Founders manage roles" ON public.user_roles
  USING (app_private.has_role(auth.uid(), 'founder'))
  WITH CHECK (app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Editors insert leads" ON public.leads WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Editors update leads" ON public.leads USING (app_private.can_edit(auth.uid())) WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Founders delete leads" ON public.leads USING (app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Editors insert pilots" ON public.pilots WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Editors update pilots" ON public.pilots USING (app_private.can_edit(auth.uid())) WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Founders delete pilots" ON public.pilots USING (app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Editors insert applications" ON public.applications WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Editors update applications" ON public.applications USING (app_private.can_edit(auth.uid())) WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Founders delete applications" ON public.applications USING (app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Editors insert product_updates" ON public.product_updates WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Editors update product_updates" ON public.product_updates USING (app_private.can_edit(auth.uid())) WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Founders delete product_updates" ON public.product_updates USING (app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Editors insert content_posts" ON public.content_posts WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Editors update content_posts" ON public.content_posts USING (app_private.can_edit(auth.uid())) WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Founders delete content_posts" ON public.content_posts USING (app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Editors insert tasks" ON public.tasks WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Editors update tasks" ON public.tasks USING (app_private.can_edit(auth.uid())) WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Founders delete tasks" ON public.tasks USING (app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Editors insert milestones" ON public.milestones WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Editors update milestones" ON public.milestones USING (app_private.can_edit(auth.uid())) WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Founders delete milestones" ON public.milestones USING (app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Editors insert proof_documents" ON public.proof_documents WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Editors update proof_documents" ON public.proof_documents USING (app_private.can_edit(auth.uid())) WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Founders delete proof_documents" ON public.proof_documents USING (app_private.has_role(auth.uid(), 'founder'));

ALTER POLICY "Editors insert team_members" ON public.team_members WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Editors update team_members" ON public.team_members USING (app_private.can_edit(auth.uid())) WITH CHECK (app_private.can_edit(auth.uid()));
ALTER POLICY "Founders delete team_members" ON public.team_members USING (app_private.has_role(auth.uid(), 'founder'));

DROP POLICY IF EXISTS "Editors insert objects" ON storage.objects;
DROP POLICY IF EXISTS "Editors update objects" ON storage.objects;
DROP POLICY IF EXISTS "Founders delete objects" ON storage.objects;
CREATE POLICY "Editors insert objects" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proof-vault' AND app_private.can_edit(auth.uid()));
CREATE POLICY "Editors update objects" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'proof-vault' AND app_private.can_edit(auth.uid())) WITH CHECK (bucket_id = 'proof-vault' AND app_private.can_edit(auth.uid()));
CREATE POLICY "Founders delete objects" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'proof-vault' AND app_private.has_role(auth.uid(), 'founder'));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_edit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;