-- No schema changes needed for the tenant portal.
-- The portal uses the service-role key server-side (lib/supabase/admin.ts)
-- which bypasses RLS, so existing tables work as-is.
--
-- Required env var: SUPABASE_SERVICE_ROLE_KEY
-- Find it in: Supabase dashboard â†’ Settings â†’ API â†’ service_role (secret)
-- Add it to .env.local â€” it is NEVER exposed to the browser.

