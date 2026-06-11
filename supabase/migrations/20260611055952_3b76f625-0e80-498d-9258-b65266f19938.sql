
-- 1) Invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL,
  token_hash text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS invites_email_idx ON public.invites (lower(email));
CREATE INDEX IF NOT EXISTS invites_status_idx ON public.invites (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO authenticated;
GRANT ALL ON public.invites TO service_role;

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Founders can view invites" ON public.invites;
CREATE POLICY "Founders can view invites" ON public.invites
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'founder'));

DROP POLICY IF EXISTS "Founders can create invites" ON public.invites;
CREATE POLICY "Founders can create invites" ON public.invites
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'founder'));

DROP POLICY IF EXISTS "Founders can update invites" ON public.invites;
CREATE POLICY "Founders can update invites" ON public.invites
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'founder'));

-- 2) Rewrite handle_new_user to require an invite (bootstrap first founder)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  founder_count INT;
  v_invite public.invites%ROWTYPE;
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO founder_count FROM public.user_roles WHERE role = 'founder';

  IF founder_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'founder')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  -- Find a valid pending invite for this email
  SELECT * INTO v_invite
  FROM public.invites
  WHERE lower(email) = lower(NEW.email)
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'No valid invite for %', NEW.email USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_invite.role)
  ON CONFLICT DO NOTHING;

  UPDATE public.invites
  SET status = 'accepted', accepted_by = NEW.id, accepted_at = now()
  WHERE id = v_invite.id;

  RETURN NEW;
END;
$$;

-- Make sure the trigger exists (it already should, but be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Helper: consume an invite by raw token, returning role on success
CREATE OR REPLACE FUNCTION public.consume_invite(_token text, _user_id uuid, _email text)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_invite public.invites%ROWTYPE;
BEGIN
  v_hash := encode(extensions.digest(_token, 'sha256'), 'hex');

  SELECT * INTO v_invite
  FROM public.invites
  WHERE token_hash = v_hash
    AND status = 'pending'
    AND expires_at > now()
    AND lower(email) = lower(_email)
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'Invite invalid, expired, or email mismatch' USING ERRCODE = '42501';
  END IF;

  -- Ensure role is set
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, v_invite.role)
  ON CONFLICT DO NOTHING;

  UPDATE public.invites
  SET status = 'accepted', accepted_by = _user_id, accepted_at = now()
  WHERE id = v_invite.id;

  RETURN v_invite.role;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
