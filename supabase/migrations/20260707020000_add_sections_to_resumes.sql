-- Add sections column to resumes table to allow dynamic sections layout
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb;
