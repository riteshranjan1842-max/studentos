-- Add reattempt columns to dsa_tracker table
ALTER TABLE public.dsa_tracker
  ADD COLUMN IF NOT EXISTS reattempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS reattempt_days integer;
