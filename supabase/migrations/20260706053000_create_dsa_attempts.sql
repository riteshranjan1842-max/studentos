-- Create dsa_attempts table to store multiple approaches per problem
CREATE TABLE IF NOT EXISTS public.dsa_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES public.dsa_tracker(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  approach_name text NOT NULL, -- e.g. "Brute Force", "Optimized", "Optimal"
  time_complexity text NOT NULL, -- e.g. "O(N^2)"
  space_complexity text NOT NULL, -- e.g. "O(1)"
  code_snippet text, -- user code
  notes text, -- notes or explanations
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add AI judgment cache column to dsa_tracker
ALTER TABLE public.dsa_tracker
  ADD COLUMN IF NOT EXISTS ai_judgment text;

-- Enable Row Level Security
ALTER TABLE public.dsa_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attempts" ON public.dsa_attempts;
CREATE POLICY "select_own_attempts" ON public.dsa_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_attempts" ON public.dsa_attempts;
CREATE POLICY "insert_own_attempts" ON public.dsa_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_attempts" ON public.dsa_attempts;
CREATE POLICY "update_own_attempts" ON public.dsa_attempts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_attempts" ON public.dsa_attempts;
CREATE POLICY "delete_own_attempts" ON public.dsa_attempts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dsa_attempts_problem ON public.dsa_attempts (problem_id);
CREATE INDEX IF NOT EXISTS idx_dsa_attempts_user ON public.dsa_attempts (user_id);
