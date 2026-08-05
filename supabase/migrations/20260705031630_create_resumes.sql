/*
# Create resumes table

1. New Tables
- `resumes`
  - id (uuid, primary key)
  - user_id (uuid, owner, defaults to auth.uid(), references auth.users, UNIQUE)
  - full_name (text, nullable)
  - email (text, nullable)
  - phone (text, nullable)
  - location (text, nullable)
  - linkedin (text, nullable)
  - github (text, nullable)
  - website (text, nullable)
  - summary (text, nullable — professional summary / objective)
  - education (jsonb, nullable — array of {institution, degree, field, startYear, endYear, gpa})
  - experience (jsonb, nullable — array of {company, role, startDate, endDate, description})
  - skills (jsonb, nullable — array of strings)
  - projects (jsonb, nullable — array of {name, description, link, tech})
  - created_at (timestamptz, defaults to now())
  - updated_at (timestamptz, defaults to now())

2. Security
- Enable RLS on resumes.
- Owner-scoped CRUD: each authenticated user can only access their own resume.
- user_id defaults to auth.uid() so inserts that omit it succeed.
- UNIQUE constraint on user_id — one resume per user (upsert pattern).

3. Notes
- education/experience/skills/projects stored as jsonb for flexible array structures.
- Frontend uses upsert on user_id to create-or-update the single resume row.
*/

CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  location text,
  linkedin text,
  github text,
  website text,
  summary text,
  education jsonb,
  experience jsonb,
  skills jsonb,
  projects jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resumes_user_id_key UNIQUE (user_id)
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_resume" ON public.resumes;
CREATE POLICY "select_own_resume" ON public.resumes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_resume" ON public.resumes;
CREATE POLICY "insert_own_resume" ON public.resumes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_resume" ON public.resumes;
CREATE POLICY "update_own_resume" ON public.resumes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_resume" ON public.resumes;
CREATE POLICY "delete_own_resume" ON public.resumes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
