-- Add body_font_size column to resumes table to persist font size settings
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS body_font_size text DEFAULT '12px';
