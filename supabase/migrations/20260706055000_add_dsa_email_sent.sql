-- Add email_sent column to dsa_tracker table
ALTER TABLE public.dsa_tracker
  ADD COLUMN IF NOT EXISTS email_sent boolean NOT NULL DEFAULT false;
