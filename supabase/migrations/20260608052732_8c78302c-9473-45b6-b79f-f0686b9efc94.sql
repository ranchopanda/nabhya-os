DROP POLICY IF EXISTS "Editors upload proof-vault" ON storage.objects;
DROP POLICY IF EXISTS "Editors update proof-vault" ON storage.objects;
DROP POLICY IF EXISTS "Founders delete proof-vault" ON storage.objects;

GRANT USAGE ON SCHEMA app_private TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION app_private.can_edit(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, app_role) TO authenticated, anon, service_role;