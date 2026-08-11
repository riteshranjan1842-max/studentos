-- Create coding_roadmap table
CREATE TABLE IF NOT EXISTS public.coding_roadmap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone_id)
);

ALTER TABLE public.coding_roadmap ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_roadmap" ON public.coding_roadmap;
CREATE POLICY "select_own_roadmap" ON public.coding_roadmap
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_roadmap" ON public.coding_roadmap;
CREATE POLICY "insert_own_roadmap" ON public.coding_roadmap
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_roadmap" ON public.coding_roadmap;
CREATE POLICY "update_own_roadmap" ON public.coding_roadmap
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_roadmap" ON public.coding_roadmap;
CREATE POLICY "delete_own_roadmap" ON public.coding_roadmap
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coding_roadmap_user ON public.coding_roadmap (user_id);
