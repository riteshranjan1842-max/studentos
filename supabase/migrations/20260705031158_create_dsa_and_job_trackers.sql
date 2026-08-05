/*
# Create dsa_tracker and job_applications tables

1. New Tables
- `dsa_tracker`
  - id (uuid, primary key)
  - user_id (uuid, owner, defaults to auth.uid(), references auth.users)
  - problem_name (text, not null)
  - topic (text, not null — Arrays, Strings, Stacks/Queues, Trees, Graphs, Other)
  - difficulty (text, not null, CHECK Easy/Medium/Hard)
  - status (text, not null default 'Unsolved', CHECK Unsolved/In Progress/Solved)
  - solution_link (text, nullable — LeetCode or any solution URL)
  - updated_at (timestamptz, defaults to now())

- `job_applications`
  - id (uuid, primary key)
  - user_id (uuid, owner, defaults to auth.uid(), references auth.users)
  - company_name (text, not null)
  - role (text, not null)
  - status (text, not null default 'Applied', CHECK Applied/Interviewing/Offer/Rejected)
  - date_applied (date, not null, defaults to today)
  - created_at (timestamptz, defaults to now())

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- user_id defaults to auth.uid() so inserts that omit it succeed.

3. Notes
- dsa_tracker.status defaults to 'Unsolved' so a freshly added problem starts unsolved.
- job_applications.status defaults to 'Applied' so new cards land in the Applied column.
- date_applied is a date (not timestamp) for clean calendar display.
*/

-- dsa_tracker
CREATE TABLE IF NOT EXISTS public.dsa_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_name text NOT NULL,
  topic text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Easy','Medium','Hard')),
  status text NOT NULL DEFAULT 'Unsolved' CHECK (status IN ('Unsolved','In Progress','Solved')),
  solution_link text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dsa_tracker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_dsa" ON public.dsa_tracker;
CREATE POLICY "select_own_dsa" ON public.dsa_tracker
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_dsa" ON public.dsa_tracker;
CREATE POLICY "insert_own_dsa" ON public.dsa_tracker
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_dsa" ON public.dsa_tracker;
CREATE POLICY "update_own_dsa" ON public.dsa_tracker
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_dsa" ON public.dsa_tracker;
CREATE POLICY "delete_own_dsa" ON public.dsa_tracker
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dsa_user_topic ON public.dsa_tracker (user_id, topic);

-- job_applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied','Interviewing','Offer','Rejected')),
  date_applied date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_jobs" ON public.job_applications;
CREATE POLICY "select_own_jobs" ON public.job_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_jobs" ON public.job_applications;
CREATE POLICY "insert_own_jobs" ON public.job_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_jobs" ON public.job_applications;
CREATE POLICY "update_own_jobs" ON public.job_applications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_jobs" ON public.job_applications;
CREATE POLICY "delete_own_jobs" ON public.job_applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.job_applications (user_id, status);
