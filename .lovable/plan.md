

## Plan: Fix Vector Schema for Semantic Search

### Problem
The `search_documents_semantic` function is failing because:
- The `embedding` column is of type `extensions.vector`
- The `<=>` cosine distance operator is defined in the `extensions` schema
- The function's `search_path` is set to only `public`, so PostgreSQL can't find the operator

**Error:** `operator does not exist: extensions.vector <=> extensions.vector`

---

### Solution

Update the database function to include `extensions` in the search path.

**File:** New migration to update `search_documents_semantic`

**Change:** Line 14 in the function definition

| Before | After |
|--------|-------|
| `SET search_path TO 'public'` | `SET search_path TO 'public', 'extensions'` |

**Full Migration SQL:**
```sql
CREATE OR REPLACE FUNCTION public.search_documents_semantic(
  query_embedding vector(768),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.document_id,
    de.content,
    de.metadata,
    (1 - (de.embedding <=> query_embedding))::float as similarity
  FROM document_embeddings de
  WHERE de.embedding IS NOT NULL
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

### Why This Works

1. PostgreSQL uses `search_path` to resolve unqualified types and operators
2. By adding `extensions` to the search path, the `<=>` operator becomes visible
3. The vector type and operator will now resolve correctly
4. `SECURITY DEFINER` ensures the function runs with elevated privileges to access the embeddings

---

### Expected Outcome

After this migration:
- Semantic search will use the pgvector `<=>` operator for cosine similarity
- User queries will match against 5,678 document embeddings
- No more fallback to text-based search
- Faster and more accurate RAG retrieval

