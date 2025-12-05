-- Fix system_settings RLS to restrict all settings to admin-only

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public can read non-sensitive settings" ON public.system_settings;

-- All system settings are now admin-only (the existing admin policy covers this)
-- If specific settings need to be public in the future, create a whitelist policy