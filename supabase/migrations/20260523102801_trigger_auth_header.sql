-- Update the order email trigger to pass the service-role key as an Authorization header.
-- This matches the auth guard added to the order-email-dispatcher edge function.
-- The service_role key is available via the supabase_admin role's GUC settings.

CREATE OR REPLACE FUNCTION public.notify_order_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  should_send boolean := false;
  _service_key text;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    should_send := true;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status
         AND NEW.status IN ('confirmed', 'rejected')) THEN
    should_send := true;
  END IF;

  IF NOT should_send THEN
    RETURN NEW;
  END IF;

  -- Read the service role key from Supabase vault/secrets or app settings
  _service_key := coalesce(
    current_setting('supabase.service_role_key', true),
    current_setting('app.settings.service_role_key', true)
  );

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  PERFORM net.http_post(
    url := 'https://xkvabcmitoztsqvrgscu.supabase.co/functions/v1/order-email-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(_service_key, '')
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Re-revoke direct execution
REVOKE EXECUTE ON FUNCTION public.notify_order_email() FROM PUBLIC, anon, authenticated;
