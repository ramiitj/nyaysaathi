-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public can read embeddings for RAG" ON public.document_embeddings;

-- The "Admins can manage embeddings" policy already exists and provides admin-only access
-- Edge functions using service_role key bypass RLS, so RAG functionality is preserved