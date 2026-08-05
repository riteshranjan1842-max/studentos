/*
# Create timetable_entries table

1. New Tables
- `timetable_entries`
  - `id` (uuid, primary key)
  - `user_id` (uuid, owner, defaults to auth.uid(), references auth.users)
  - `day` (text, not null — one of Monday..Friday)
  - `subject` (text, not null)
  - `start_time` (text, not null — HH:MM 24h, e.g. "09:00")
  - `end_time` (text, not null — HH:MM 24h, e.g. "10:30")
  - `room` (text, nullable — room code/location)
  - `color` (text, not null default 'sky' — one of sky/emerald/amber/rose/violet)
  - `created_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on timetable_entries.
- Owner-scoped CRUD: each authenticated user can only access their own entries.
- user_id defaults to auth.uid() so inserts that omit it succeed.

3. Notes
- No unique constraint — a user can have multiple classes on the same day at different times.
- color is a frontend display hint (maps to a Tailwind color class), not a domain value.
- Times stored as text (HH:MM) for simple frontend rendering; ordering done client-side.
*/

CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  day text NOT NULL CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
  subject text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  room text,
  color text NOT NULL DEFAULT 'sky',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_timetable" ON public.timetable_entries;
CREATE POLICY "select_own_timetable" ON public.timetable_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_timetable" ON public.timetable_entries;
CREATE POLICY "insert_own_timetable" ON public.timetable_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_timetable" ON public.timetable_entries;
CREATE POLICY "update_own_timetable" ON public.timetable_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_timetable" ON public.timetable_entries;
CREATE POLICY "delete_own_timetable" ON public.timetable_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timetable_user_day ON public.timetable_entries (user_id, day);
