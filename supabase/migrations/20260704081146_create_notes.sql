/*
# Create notes table

1. New Tables
- `notes`
  - `id` (uuid, primary key)
  - `user_id` (uuid, owner, defaults to auth.uid(), references auth.users)
  - `title` (text, not null, default 'Untitled')
  - `content` (text, nullable — raw HTML from the rich-text editor)
  - `created_at` (timestamptz, defaults to now())
  - `updated_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on notes.
- Owner-scoped CRUD: each authenticated user can only access their own notes.
- user_id defaults to auth.uid() so inserts that omit it succeed.

3. Notes
- content stored as HTML string produced by the contentEditable editor.
- updated_at bumped on every save (frontend sets it).
*/

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notes" ON public.notes;
CREATE POLICY "select_own_notes" ON public.notes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notes" ON public.notes;
CREATE POLICY "insert_own_notes" ON public.notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notes" ON public.notes;
CREATE POLICY "update_own_notes" ON public.notes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notes" ON public.notes;
CREATE POLICY "delete_own_notes" ON public.notes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes (user_id, updated_at DESC);
