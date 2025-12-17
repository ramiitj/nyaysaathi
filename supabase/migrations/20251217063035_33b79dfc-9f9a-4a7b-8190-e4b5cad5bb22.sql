-- Ensure the existing SELECT policy for conversations is correct
-- Drop and recreate to ensure it's RESTRICTIVE (not PERMISSIVE)

DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;

-- Create a RESTRICTIVE SELECT policy that only allows admins to read conversations
CREATE POLICY "Admins can view all conversations" 
ON public.conversations 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));