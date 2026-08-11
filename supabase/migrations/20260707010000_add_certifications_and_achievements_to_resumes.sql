-- Add certifications and achievements columns to resumes table
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS achievements jsonb DEFAULT '[]'::jsonb;
