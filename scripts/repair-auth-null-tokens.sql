-- Trade-In Pro - prepared Auth repair, NOT automatically executed.
-- Scope: target Supabase xuvaihwygkcwriqfnkbg, not the Lovable source.
-- Reason: GoTrue signInWithPassword returns HTTP 500, with
-- "converting NULL to string is unsupported" for confirmation_token.
--
-- APPROVAL REQUIRED: this statement updates 17 existing auth.users records.
-- Before execution: take a verified, access-controlled backup of auth.users,
-- validate the destination project, and coordinate a short login test window.
-- No email, UUID, password hash, confirmation status, or non-null token changes.
-- No use of the abandoned staging project gsaazisxtvjhekkwhulz.
--
-- Live read-only audit (2026-11-22 18:21 UTC):
-- 17 accounts, all 17 have NULL in confirmation_token,
-- recovery_token and email_change_token_new; no missing password hash.
-- 0 user-defined triggers on auth.users at the time of inspection.
-- Reference: https://supabase.com/docs/guides/troubleshooting/scan-error-on-column-confirmation_token-converting-null-to-string-is-unsupported-during-auth-login-a0c686
--
-- Execute ONLY after the owner explicitly approves modifying the destination
-- auth accounts. A successful SQL statement does not prove login success.

BEGIN;

SET LOCAL lock_timeout = '5s';

DO $preflight$
DECLARE
  total_users integer;
  missing_hashes integer;
BEGIN
  SELECT count(*), count(*) FILTER (
    WHERE encrypted_password IS NULL OR encrypted_password = ''
  )
  INTO total_users, missing_hashes
  FROM auth.users;

  IF total_users <> 17 OR missing_hashes <> 0 THEN
    RAISE EXCEPTION 'Auth preflight changed: users %, missing passwords %. Abort.',
      total_users, missing_hashes;
  END IF;
END;
$preflight$;

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL;

DO $verify$
DECLARE
  remaining_nulls integer;
  users_total integer;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (
      WHERE confirmation_token IS NULL
      OR recovery_token IS NULL
      OR email_change_token_new IS NULL
    )
  INTO users_total, remaining_nulls
  FROM auth.users;

  IF users_total <> 17 OR remaining_nulls <> 0 THEN
    RAISE EXCEPTION 'Auth post-check failed: users %, remaining NULLs %. Rolling back.',
      users_total, remaining_nulls;
  END IF;
END;
$verify$;

COMMIT;

-- After approval and execution, separately test a controlled sign-in, sign-out,
-- session restoration and password recovery on Cloudflare Preview.
-- Check Auth logs for new errors; do not use users' plaintext passwords.
