ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_view_date TEXT;

CREATE OR REPLACE FUNCTION public.claim_daily_view(
  p_user_id UUID,
  p_today TEXT,
  p_limit INTEGER
)
RETURNS TABLE(can_view BOOLEAN, count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_count INTEGER;
  current_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET
    daily_view_date = p_today,
    daily_view_count = CASE
      WHEN daily_view_date = p_today THEN daily_view_count + 1
      ELSE 1
    END
  WHERE id = p_user_id
    AND (
      daily_view_date IS DISTINCT FROM p_today
      OR daily_view_count < p_limit
    )
  RETURNING daily_view_count INTO claimed_count;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, claimed_count;
    RETURN;
  END IF;

  SELECT
    CASE
      WHEN daily_view_date = p_today THEN daily_view_count
      ELSE 0
    END
  INTO current_count
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN QUERY SELECT FALSE, COALESCE(current_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_view(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_view(UUID, TEXT, INTEGER) TO service_role;
