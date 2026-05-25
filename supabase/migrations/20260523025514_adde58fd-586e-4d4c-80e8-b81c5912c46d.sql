
-- Extend enums
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'usdt_trc20';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'usdt_erc20';

-- Verified columns (mirror reviewed_* but match PRD naming)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: files live under <user_id>/<filename>
CREATE POLICY "proofs_user_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "proofs_user_read_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "proofs_admin_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND public.has_role(auth.uid(), 'admin')
  );
