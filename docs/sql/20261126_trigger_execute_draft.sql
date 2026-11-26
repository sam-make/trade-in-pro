-- DRAFT ONLY: do not apply without security/QA review and explicit production approval.
-- Preconditions verified 2026-11-26: both functions return trigger; PUBLIC lacks EXECUTE;
-- anon and authenticated currently have EXECUTE; 4 and 2 existing triggers respectively.
-- Validate in an isolated disposable database: existing trigger execution, audit writes,
-- member access guards, role inheritance and rollback. Never test with real shop data.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.capture_shop_activity() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_member_access() FROM anon, authenticated;
-- Expected: has_function_privilege(role, function, 'EXECUTE') = false for both roles.
-- Existing trigger execution and authorized business writes must still pass.
COMMIT;
-- Rollback, only if these grants matched the pre-migration ACL:
-- GRANT EXECUTE ON FUNCTION public.capture_shop_activity() TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.guard_member_access() TO anon, authenticated;
