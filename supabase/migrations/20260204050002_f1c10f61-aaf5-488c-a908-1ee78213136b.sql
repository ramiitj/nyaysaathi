CREATE OR REPLACE FUNCTION public.get_document_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM documents),
    'processed', (SELECT COUNT(*) FROM documents WHERE status = 'processed'),
    'pending', (SELECT COUNT(*) FROM documents WHERE status = 'pending'),
    'failed', (SELECT COUNT(*) FROM documents WHERE status = 'failed')
  ) INTO result;
  RETURN result;
END;
$$;