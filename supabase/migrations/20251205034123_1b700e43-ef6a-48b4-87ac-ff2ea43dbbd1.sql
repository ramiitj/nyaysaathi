-- Drop the overly permissive public policies on user_visitors
DROP POLICY IF EXISTS "Public can read own visitor record" ON public.user_visitors;
DROP POLICY IF EXISTS "Public can update own visitor record" ON public.user_visitors;

-- Create a security definer function for visitors to look up their own record by fingerprint
-- This prevents direct table access while allowing the app to function
CREATE OR REPLACE FUNCTION public.get_visitor_by_fingerprint(fingerprint text)
RETURNS TABLE (
  id uuid,
  fingerprint_hash text,
  visit_count integer,
  first_visit_at timestamptz,
  last_visit_at timestamptz,
  onboarding_complete boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    fingerprint_hash,
    visit_count,
    first_visit_at,
    last_visit_at,
    onboarding_complete
  FROM public.user_visitors
  WHERE fingerprint_hash = fingerprint
  LIMIT 1;
$$;

-- Create a security definer function to update visitor record by fingerprint
CREATE OR REPLACE FUNCTION public.update_visitor_by_fingerprint(
  fingerprint text,
  new_visit_count integer DEFAULT NULL,
  new_onboarding_complete boolean DEFAULT NULL,
  new_device_info jsonb DEFAULT NULL,
  new_location_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  visitor_id uuid;
BEGIN
  UPDATE public.user_visitors
  SET 
    visit_count = COALESCE(new_visit_count, visit_count),
    onboarding_complete = COALESCE(new_onboarding_complete, onboarding_complete),
    device_info = COALESCE(new_device_info, device_info),
    location_data = COALESCE(new_location_data, location_data),
    last_visit_at = now(),
    updated_at = now()
  WHERE fingerprint_hash = fingerprint
  RETURNING id INTO visitor_id;
  
  RETURN visitor_id;
END;
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.get_visitor_by_fingerprint(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_visitor_by_fingerprint(text, integer, boolean, jsonb, jsonb) TO anon, authenticated;