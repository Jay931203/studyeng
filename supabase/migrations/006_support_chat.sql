CREATE TABLE IF NOT EXISTS public.support_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT,
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting_admin', 'waiting_user', 'resolved')),
  needs_human BOOLEAN NOT NULL DEFAULT FALSE,
  last_message_preview TEXT NOT NULL DEFAULT '',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_last_read_at TIMESTAMPTZ,
  admin_last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.support_threads(id) ON DELETE CASCADE NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'assistant', 'admin')),
  sender_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support threads" ON public.support_threads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own support threads" ON public.support_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support threads" ON public.support_threads
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all support threads" ON public.support_threads
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

CREATE POLICY "Users can view own support messages" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.support_threads thread
      WHERE thread.id = support_messages.thread_id
        AND thread.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own support messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    sender_role = 'user'
    AND sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.support_threads thread
      WHERE thread.id = support_messages.thread_id
        AND thread.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all support messages" ON public.support_messages
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

CREATE TRIGGER support_threads_updated_at
  BEFORE UPDATE ON public.support_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_support_threads_last_message_at ON public.support_threads(last_message_at DESC);
CREATE INDEX idx_support_threads_status ON public.support_threads(status, needs_human);
CREATE INDEX idx_support_messages_thread_id ON public.support_messages(thread_id, created_at);
