-- Remove resumes_user_id_key unique constraint to support multiple resumes per user
ALTER TABLE public.resumes DROP CONSTRAINT IF EXISTS resumes_user_id_key;
