-- Add explicit SELECT policy for system_settings - only admins can read
-- This ensures public users cannot read system configuration even if RLS has issues
CREATE POLICY "Only admins can read system settings"
ON public.system_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));