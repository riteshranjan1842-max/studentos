/*
# Add student-specific fields to resumes

1. New Columns on `resumes`
- is_fresher (boolean, default false) — when true, the portfolio skips the work-experience block.
- tenth_marks (text, nullable) — 10th board percentage.
- tenth_year (text, nullable) — 10th completion year.
- tenth_board (text, nullable) — 10th board (CBSE, ICSE, State Board, etc.).
- twelfth_marks (text, nullable) — 12th board percentage.
- twelfth_year (text, nullable) — 12th completion year.
- twelfth_board (text, nullable) — 12th board.

2. Notes
- All new columns are nullable / have defaults so existing rows stay valid.
- is_fresher defaults to false so existing users keep their experience data visible.
- Marks stored as text to allow flexible input ("95.2", "A+", "91%").
*/

ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS is_fresher boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tenth_marks text,
  ADD COLUMN IF NOT EXISTS tenth_year text,
  ADD COLUMN IF NOT EXISTS tenth_board text,
  ADD COLUMN IF NOT EXISTS twelfth_marks text,
  ADD COLUMN IF NOT EXISTS twelfth_year text,
  ADD COLUMN IF NOT EXISTS twelfth_board text;
