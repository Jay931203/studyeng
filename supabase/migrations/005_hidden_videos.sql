ALTER TABLE public.issue_reports
  ADD COLUMN IF NOT EXISTS reporter_email TEXT;

CREATE TABLE IF NOT EXISTS public.hidden_videos (
  video_id TEXT PRIMARY KEY,
  hidden_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hidden_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hidden_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hidden videos" ON public.hidden_videos
  FOR SELECT USING (true);

CREATE POLICY "Admins manage hidden videos" ON public.hidden_videos
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

DROP TRIGGER IF EXISTS hidden_videos_updated_at ON public.hidden_videos;

CREATE TRIGGER hidden_videos_updated_at
  BEFORE UPDATE ON public.hidden_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_hidden_videos_hidden_by ON public.hidden_videos(hidden_by);
