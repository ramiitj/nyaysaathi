-- Fix user_files table RLS policies to restrict access by visitor_id

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Public can read user files" ON public.user_files;
DROP POLICY IF EXISTS "Public can update own user files" ON public.user_files;
DROP POLICY IF EXISTS "Public can delete user files" ON public.user_files;

-- Create visitor-scoped policies using a security definer function
CREATE OR REPLACE FUNCTION public.get_visitor_id_by_fingerprint(fingerprint text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.user_visitors WHERE fingerprint_hash = fingerprint LIMIT 1;
$$;

-- Users can read their own files (via fingerprint stored in app setting or by conversation)
CREATE POLICY "Users can read own files" ON public.user_files
FOR SELECT USING (
  visitor_id = public.get_visitor_id_by_fingerprint(current_setting('app.fingerprint', true))
  OR has_role(auth.uid(), 'admin')
);

-- Users can update their own files only
CREATE POLICY "Users can update own files" ON public.user_files
FOR UPDATE USING (
  visitor_id = public.get_visitor_id_by_fingerprint(current_setting('app.fingerprint', true))
  OR has_role(auth.uid(), 'admin')
);

-- Users can delete their own files only
CREATE POLICY "Users can delete own files" ON public.user_files
FOR DELETE USING (
  visitor_id = public.get_visitor_id_by_fingerprint(current_setting('app.fingerprint', true))
  OR has_role(auth.uid(), 'admin')
);

-- Fix storage bucket policies for user_files

-- Drop the overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can read user files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload user files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete user files" ON storage.objects;

-- Create restricted storage policies
-- Files are stored with visitor_id as the folder prefix, e.g., "visitor-uuid/filename.pdf"

-- Users can read files in their own folder
CREATE POLICY "Users can read own user files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user_files' AND (
    (storage.foldername(name))[1] = current_setting('app.visitor_id', true)
    OR has_role(auth.uid(), 'admin')
  )
);

-- Users can upload files to their own folder
CREATE POLICY "Users can upload own user files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user_files' AND (
    (storage.foldername(name))[1] = current_setting('app.visitor_id', true)
    OR has_role(auth.uid(), 'admin')
  )
);

-- Users can delete files in their own folder
CREATE POLICY "Users can delete own user files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user_files' AND (
    (storage.foldername(name))[1] = current_setting('app.visitor_id', true)
    OR has_role(auth.uid(), 'admin')
  )
);