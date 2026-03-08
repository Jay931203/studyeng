ALTER TABLE public.watch_history
  ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.recommendation_signals (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  skips INTEGER DEFAULT 0,
  total_completion_ratio DOUBLE PRECISION DEFAULT 0,
  last_interacted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.admin_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.issue_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id TEXT NOT NULL,
  youtube_id TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  reporter_email TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.subtitle_flags (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id TEXT NOT NULL,
  entry_index INTEGER NOT NULL,
  en TEXT NOT NULL DEFAULT '',
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id, entry_index)
);

ALTER TABLE public.recommendation_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtitle_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own recommendation_signals" ON public.recommendation_signals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own admin account" ON public.admin_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own issue reports" ON public.issue_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own issue reports" ON public.issue_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all issue reports" ON public.issue_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.admin_accounts admin_account
      WHERE admin_account.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_accounts admin_account
      WHERE admin_account.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage subtitle flags" ON public.subtitle_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.admin_accounts admin_account
      WHERE admin_account.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_accounts admin_account
      WHERE admin_account.user_id = auth.uid()
    )
  );

CREATE TRIGGER recommendation_signals_updated_at
  BEFORE UPDATE ON public.recommendation_signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER issue_reports_updated_at
  BEFORE UPDATE ON public.issue_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_watch_history_completion_count ON public.watch_history(user_id, completion_count);
CREATE INDEX idx_recommendation_signals_user_id ON public.recommendation_signals(user_id);
CREATE INDEX idx_issue_reports_user_id ON public.issue_reports(user_id, resolved);
CREATE INDEX idx_subtitle_flags_user_id ON public.subtitle_flags(user_id);
