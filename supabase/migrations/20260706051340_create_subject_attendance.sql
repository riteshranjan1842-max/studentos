-- Create subject_attendance table
CREATE TABLE IF NOT EXISTS public.subject_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  attended integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subject_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attendance" ON public.subject_attendance;
CREATE POLICY "select_own_attendance" ON public.subject_attendance
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_attendance" ON public.subject_attendance;
CREATE POLICY "insert_own_attendance" ON public.subject_attendance
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_attendance" ON public.subject_attendance;
CREATE POLICY "update_own_attendance" ON public.subject_attendance
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_attendance" ON public.subject_attendance;
CREATE POLICY "delete_own_attendance" ON public.subject_attendance
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subject_attendance_user ON public.subject_attendance (user_id);
