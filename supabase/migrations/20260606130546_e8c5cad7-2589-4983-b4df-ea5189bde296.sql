CREATE POLICY "Authenticated read proof-vault"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'proof-vault');

CREATE POLICY "Editors upload proof-vault"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proof-vault' AND public.can_edit(auth.uid()));

CREATE POLICY "Editors update proof-vault"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'proof-vault' AND public.can_edit(auth.uid()));

CREATE POLICY "Founders delete proof-vault"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'proof-vault' AND public.has_role(auth.uid(), 'founder'));