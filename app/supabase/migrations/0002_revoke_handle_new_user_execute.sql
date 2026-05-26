-- 0002 — Lock down the public RPC surface for handle_new_user.
--
-- The function is a SECURITY DEFINER trigger callback that creates default
-- company_settings + expense_categories rows when a new user signs up via
-- Supabase Auth. It must NOT be callable via /rest/v1/rpc — the trigger
-- itself still runs because it's owned by the postgres role.

revoke execute on function public.handle_new_user() from anon, authenticated, public;
