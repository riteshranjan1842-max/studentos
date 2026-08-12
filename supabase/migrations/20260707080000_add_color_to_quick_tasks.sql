-- Add color column to quick_tasks table
ALTER TABLE public.quick_tasks ADD COLUMN IF NOT EXISTS color text;
