ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS tenth_school text,
ADD COLUMN IF NOT EXISTS tenth_city text,
ADD COLUMN IF NOT EXISTS twelfth_school text,
ADD COLUMN IF NOT EXISTS twelfth_city text;
