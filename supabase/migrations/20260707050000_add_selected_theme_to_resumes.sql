-- Add selected_theme column to resumes table to persist template selection
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS selected_theme text DEFAULT 'modern-dark';
