
-- Set search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Revoke execute from public/authenticated on security-definer internals
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
-- has_role must remain callable by authenticated users (used in RLS via SQL, fine even if revoked; keep available)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Tighten support_messages insert: limit to authenticated OR anon with required fields present
DROP POLICY IF EXISTS "support_insert_any" ON public.support_messages;
CREATE POLICY "support_insert_public" ON public.support_messages
  FOR INSERT
  WITH CHECK (
    char_length(name) > 0
    AND char_length(email) > 0
    AND char_length(message) > 0
    AND (user_id IS NULL OR user_id = auth.uid())
  );
