-- 0005: grant DML privileges to `authenticated` on all public tables.
--
-- The init migration (0001) enables RLS and creates "own rows" policies, but
-- never grants SELECT/INSERT/UPDATE/DELETE on the tables themselves. Postgres
-- checks table-level grants BEFORE evaluating RLS, so without these grants
-- every request from a logged-in user is rejected with 42501 "permission
-- denied for table" — observed in prod after first real login.
--
-- RLS continues to scope each request to `auth.uid() = user_id` per the
-- existing policies; these grants only unlock the path to RLS.

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Make sure future tables created in this schema inherit the same grants.
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
