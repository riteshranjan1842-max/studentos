-- Add settings columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS class_reminder_mins integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS theme_color text NOT NULL DEFAULT 'indigo';
