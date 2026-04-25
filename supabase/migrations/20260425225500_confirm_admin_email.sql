-- Confirm the configured admin account so password login works immediately.
-- This removes the "email not confirmed" blocker for the admin account.

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = 'princeesquare@gmail.com';
