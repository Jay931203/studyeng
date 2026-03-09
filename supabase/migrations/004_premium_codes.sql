CREATE TABLE IF NOT EXISTS public.premium_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  plan_key TEXT NOT NULL DEFAULT 'premium_monthly',
  duration_days INTEGER NOT NULL DEFAULT 30,
  redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  memo TEXT
);

ALTER TABLE public.premium_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redeemed codes" ON public.premium_codes
  FOR SELECT USING (auth.uid() = redeemed_by);

CREATE INDEX idx_premium_codes_code ON public.premium_codes(code);
CREATE INDEX idx_premium_codes_redeemed_by ON public.premium_codes(redeemed_by);
