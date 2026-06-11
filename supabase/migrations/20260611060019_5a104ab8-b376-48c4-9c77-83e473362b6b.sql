
REVOKE ALL ON FUNCTION public.consume_invite(text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_invite(text, uuid, text) TO service_role;
