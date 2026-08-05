/*
# Add problem_link column to dsa_tracker

1. Changes
- Add `problem_link` (text, nullable) to `public.dsa_tracker`.
- This stores the original LeetCode/GeeksforGeeks question URL, separate from
  `solution_link` which stores the user's own solution write-up URL.

2. Security
- No RLS policy changes — existing owner-scoped policies already cover the new column.

3. Notes
- Nullable: the field is optional in the Add Problem form.
- No type changes or renames, so existing data is unaffected.
*/

ALTER TABLE public.dsa_tracker
  ADD COLUMN IF NOT EXISTS problem_link text;
