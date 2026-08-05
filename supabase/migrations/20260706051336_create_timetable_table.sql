/*
# Create timetable table

1. New Tables
- `timetable`
  - id (uuid, primary key)
  - user_id (uuid, owner, defaults to auth.uid(), references auth.users)
  - branch (text, not null — e.g. Computer Science, Electronics, Mechanical, Civil, Information Technology)
  - subject (text, not null — the course name, either from the standard list or a custom entry)
  - day_of_week (text, not null, CHECK Monday..Friday)
  - start_time (text, not null — HH:MM 24h, e.g. "09:00")
  - end_time (text, not null — HH:MM 24h, e.g. "10:30")
  - professor (text, nullable — professor/instructor name)
  - room (text, nullable — room code/location)
  - color (text, not null default 'sky' — frontend display hint)
  - created_at (timestamptz, defaults to now())

2. Security
- Enable RLS on timetable.
- Owner-scoped CRUD: each authenticated user can only access their own entries.
- user_id defaults to auth.uid() so inserts that omit it succeed.

3. Notes
- This is a new table separate from the existing `timetable_entries` table.
  The user explicitly requested a `timetable` table with columns for branch,
  subject, day_of_week, start_time, and end_time.
- professor and room are included to support the weekly schedule view which
  displays professor names and room numbers.
- color is a frontend display hint (maps to a Tailwind color class), not a domain value.
- Times stored as text (HH:MM) for simple frontend rendering; ordering done client-side.
*/

CREATE TABLE IF NOT EXISTS public.timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  branch text NOT NULL,
  subject text NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
  start_time text NOT NULL,
  end_time text NOT NULL,
  professor text,
  room text,
  color text NOT NULL DEFAULT 'sky',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_timetable" ON public.timetable;
CREATE POLICY "select_own_timetable" ON public.timetable
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_timetable" ON public.timetable;
CREATE POLICY "insert_own_timetable" ON public.timetable
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_timetable" ON public.timetable;
CREATE POLICY "update_own_timetable" ON public.timetable
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_timetable" ON public.timetable;
CREATE POLICY "delete_own_timetable" ON public.timetable
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timetable_user_day ON public.timetable (user_id, day_of_week);
