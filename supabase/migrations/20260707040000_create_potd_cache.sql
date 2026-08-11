-- Create potd_cache table to cache the Problem of the Day per platform
CREATE TABLE IF NOT EXISTS public.potd_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL, -- 'leetcode', 'geeksforgeeks', 'codeforces', 'hackerrank'
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  link text NOT NULL,
  difficulty text,
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT potd_cache_platform_date_key UNIQUE (platform, date)
);

ALTER TABLE public.potd_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon/authenticated)
DROP POLICY IF EXISTS "Allow read access to potd_cache" ON public.potd_cache;
CREATE POLICY "Allow read access to potd_cache" ON public.potd_cache
  FOR SELECT TO anon, authenticated USING (true);

-- Allow service_role to manage potd_cache (bypasses RLS anyway, but good for completeness)
DROP POLICY IF EXISTS "Allow all for service_role" ON public.potd_cache;
CREATE POLICY "Allow all for service_role" ON public.potd_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);
