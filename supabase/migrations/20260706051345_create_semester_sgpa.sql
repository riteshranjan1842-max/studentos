-- Create semester_sgpa table
CREATE TABLE IF NOT EXISTS public.semester_sgpa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  semester text NOT NULL,
  sgpa numeric(4,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.semester_sgpa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sgpa" ON public.semester_sgpa;
CREATE POLICY "select_own_sgpa" ON public.semester_sgpa
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sgpa" ON public.semester_sgpa;
CREATE POLICY "insert_own_sgpa" ON public.semester_sgpa
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sgpa" ON public.semester_sgpa;
CREATE POLICY "update_own_sgpa" ON public.semester_sgpa
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sgpa" ON public.semester_sgpa;
CREATE POLICY "delete_own_sgpa" ON public.semester_sgpa
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_semester_sgpa_user ON public.semester_sgpa (user_id);
