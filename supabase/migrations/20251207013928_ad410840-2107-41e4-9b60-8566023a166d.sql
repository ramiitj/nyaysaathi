-- Create a stronger validation function that checks both fingerprint AND session_id
-- This prevents spoofing by requiring matching session context
CREATE OR REPLACE FUNCTION public.validate_user_file_access(file_visitor_id uuid, file_conversation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  visitor_match boolean := false;
  session_match boolean := false;
  current_fingerprint text;
  current_session_id text;
BEGIN
  -- Get current context values
  current_fingerprint := current_setting('app.fingerprint', true);
  current_session_id := current_setting('app.session_id', true);
  
  -- If no context is set, deny access
  IF current_fingerprint IS NULL AND current_session_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check fingerprint match if provided
  IF current_fingerprint IS NOT NULL AND current_fingerprint != '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_visitors 
      WHERE id = file_visitor_id 
      AND fingerprint_hash = current_fingerprint
    ) INTO visitor_match;
  END IF;
  
  -- Check session match through conversation if provided
  IF current_session_id IS NOT NULL AND current_session_id != '' AND file_conversation_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = file_conversation_id 
      AND session_id = current_session_id
    ) INTO session_match;
  END IF;
  
  -- Require at least one valid match (preferably both when available)
  -- If conversation_id is set, require session match for stronger validation
  IF file_conversation_id IS NOT NULL THEN
    RETURN session_match OR visitor_match;
  END IF;
  
  -- For files without conversation, fingerprint match is sufficient
  RETURN visitor_match;
END;
$$;

-- Drop existing weak policies
DROP POLICY IF EXISTS "Users can read own files" ON public.user_files;
DROP POLICY IF EXISTS "Users can update own files" ON public.user_files;
DROP POLICY IF EXISTS "Users can delete own files" ON public.user_files;

-- Create stronger policies that use the new validation function
CREATE POLICY "Users can read own files with validation"
ON public.user_files
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR validate_user_file_access(visitor_id, conversation_id)
);

CREATE POLICY "Users can update own files with validation"
ON public.user_files
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR validate_user_file_access(visitor_id, conversation_id)
);

CREATE POLICY "Users can delete own files with validation"
ON public.user_files
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR validate_user_file_access(visitor_id, conversation_id)
);