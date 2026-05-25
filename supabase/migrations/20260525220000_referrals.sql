-- ============================================
-- Referral System Tables
-- ============================================

-- 1) Referral codes (one per user)
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  uses INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 50,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_code_per_user UNIQUE (user_id)
);

-- 2) Referral tracking (who referred whom)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_applied NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 4) RLS: Users can read their own referral code
CREATE POLICY "users_own_referral_code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- 5) RLS: Users can insert their own referral code
CREATE POLICY "users_create_own_code" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6) RLS: Anyone can look up a code by its value (for checkout validation)
CREATE POLICY "anyone_lookup_code" ON public.referral_codes
  FOR SELECT USING (true);

-- 7) RLS: Users can see their own referrals
CREATE POLICY "users_own_referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- 8) RLS: System can insert referrals (user creating)
CREATE POLICY "users_create_referral" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- 9) Admins full access
CREATE POLICY "admin_referral_codes" ON public.referral_codes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_referrals" ON public.referrals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 10) Function to increment referral code usage count
CREATE OR REPLACE FUNCTION public.increment_referral_uses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.referral_codes
  SET uses = uses + 1
  WHERE code = NEW.code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_referral_created
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_referral_uses();

-- 11) Grant API access
GRANT SELECT, INSERT ON public.referral_codes TO authenticated;
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
GRANT ALL ON public.referrals TO service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
