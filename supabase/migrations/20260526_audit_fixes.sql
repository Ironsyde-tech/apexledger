-- =============================================
-- Audit Fix Migration
-- 1. Extend order_status enum (if columns use enum)
-- 2. Extend payment_method enum
-- 3. Add CHECK constraint on courses.status
-- =============================================

-- 1) Order status — add 'confirmed' and 'rejected'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'confirmed'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'rejected'; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

-- 2) Payment method — add 'usdt_trc20' and 'usdt_erc20'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    BEGIN ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'usdt_trc20'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'usdt_erc20'; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

-- 3) Course status constraint
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_status_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_status_check
  CHECK (status IN ('active', 'archived', 'coming_soon'));

-- 4) Prevent last admin from being removed
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin' AND user_id != OLD.user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_last_admin ON public.user_roles;
CREATE TRIGGER trg_prevent_last_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_removal();

NOTIFY pgrst, 'reload schema';
