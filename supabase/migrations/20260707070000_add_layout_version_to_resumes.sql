-- Add layout_version column to resumes table to support classic and updated layout versions
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS layout_version text DEFAULT 'classic';
