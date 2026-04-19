-- Add display_name to user progress
alter table gwc_user_progress
  add column if not exists display_name text;

-- Users can update their own display_name
-- (RLS policy: users can update their own row)
-- No extra policy needed if existing update policy covers all columns.
-- If update is restricted to specific columns, add:
-- create policy "users can update own display_name"
--   on gwc_user_progress for update
--   using (session_id = auth.uid())
--   with check (session_id = auth.uid());
