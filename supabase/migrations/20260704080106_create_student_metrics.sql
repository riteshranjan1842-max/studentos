/*
# Create student_metrics table

1. New Tables
- `student_metrics`
  - `id` (uuid, primary key)
  - `user_id` (uuid, owner, defaults to auth.uid(), references auth.users, unique — one row per student)
  - `cgpa` (numeric(4,2), nullable — current CGPA, e.g. 9.10)
  - `attendance_pct` (numeric(5,2), nullable — current attendance %, e.g. 89.50)
  - `dsa_solved` (integer, nullable — count of DSA problems solved)
  - `updated_at` (timestamptz, defaults to now())
  - `created_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on student_metrics.
- Owner-scoped CRUD: each authenticated user can only read/insert/update/delete their own row.
- user_id defaults to auth.uid() so inserts that omit it succeed.

3. Notes
- One row per user enforced via UNIQUE constraint on user_id.
- Nullable fields so a brand-new user with no data has NULL (rendered as N/A / 0.00 in the UI).
- AI credits intentionally NOT stored here — it's a mock value for now.
*/

CREATE TABLE IF NOT EXISTS public.student_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cgpa numeric(4,2),
  attendance_pct numeric(5,2),
  dsa_solved integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_metrics" ON public.student_metrics;
CREATE POLICY "select_own_metrics" ON public.student_metrics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_metrics" ON public.student_metrics;
CREATE POLICY "insert_own_metrics" ON public.student_metrics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_metrics" ON public.student_metrics;
CREATE POLICY "update_own_metrics" ON public.student_metrics
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_metrics" ON public.student_metrics;
CREATE POLICY "delete_own_metrics" ON public.student_metrics
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
