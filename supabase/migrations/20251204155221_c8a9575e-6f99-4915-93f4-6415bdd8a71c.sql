-- Create function to search documents using text (will be enhanced with embeddings later)
CREATE OR REPLACE FUNCTION public.search_documents(
  query_text text,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For now, use text similarity search
  -- This will be enhanced with vector similarity when embeddings are available
  RETURN QUERY
  SELECT 
    de.id,
    de.content,
    de.metadata,
    similarity(de.content, query_text)::float as similarity
  FROM document_embeddings de
  WHERE de.content % query_text OR de.content ILIKE '%' || query_text || '%'
  ORDER BY similarity(de.content, query_text) DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_documents TO anon, authenticated;