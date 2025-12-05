-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert logs" ON public.system_logs;

-- Create a new policy that only allows inserts from authenticated users (service role or admin)
-- Since Edge Functions use service_role key, they bypass RLS entirely
-- This policy prevents anonymous client-side inserts while allowing Edge Functions to log
CREATE POLICY "Only authenticated can insert logs" 
ON public.system_logs 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');