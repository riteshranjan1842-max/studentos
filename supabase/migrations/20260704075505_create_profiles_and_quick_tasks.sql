/*
# Create profiles and quick_tasks tables

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text, display name shown on dashboard)
  - `avatar_url` (text, nullable, future avatar support)
  - `created_at` (timestamptz)
- `quick_tasks`
  - `id` (uuid, primary key)
  - `user_id` (uuid, owner, defaults to auth.uid(), references auth.users)
  - `title` (text, not null)
  - `done` (boolean, default false)
  - `due_date` (date, nullable)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- profiles: owner-scoped CRUD (authenticated users manage only their own row).
- quick_tasks: owner-scoped CRUD (each user sees only their own tasks).
- user_id on quick_tasks defaults to auth.uid() so inserts that omit it succeed.

3. Notes
- Email confirmation stays OFF (default).
- No custom auth tables; Supabase auth.users is the source of truth.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON public.profiles;
CREATE POLICY "delete_own_profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.quick_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON public.quick_tasks;
CREATE POLICY "select_own_tasks" ON public.quick_tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON public.quick_tasks;
CREATE POLICY "insert_own_tasks" ON public.quick_tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON public.quick_tasks;
CREATE POLICY "update_own_tasks" ON public.quick_tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON public.quick_tasks;
CREATE POLICY "delete_own_tasks" ON public.quick_tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
