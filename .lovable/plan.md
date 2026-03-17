

## Switch RAG Pipeline to Gemini Embedding 2

### Problem
The `text-embedding-004` model is returning 404 errors on all embedding requests, causing every document to fail with 0 chunks. The new API key doesn't fix it — the model endpoint itself appears deprecated.

### Solution
Upgrade to **`gemini-embedding-2-preview`** (released March 2026) — Google's latest embedding model. It supports Matryoshka Representation Learning (MRL), so we can request **768-dimension** output to stay compatible with the existing `vector(768)` database column and `search_documents_semantic` function — no schema migration needed.

### Changes

#### 1. `supabase/functions/process-document/index.ts`
- Replace `text-embedding-004` → `gemini-embedding-2-preview` in the embedding URL and model name
- Add `outputDimensionality: 768` to the request body to match existing vector size
- Add `taskType: 'RETRIEVAL_DOCUMENT'` for better retrieval quality

#### 2. `supabase/functions/legal-chat/index.ts`
- Replace `text-embedding-004` → `gemini-embedding-2-preview` in `generateQueryEmbedding()`
- Add `outputDimensionality: 768` to the request body
- Keep `taskType: 'RETRIEVAL_QUERY'`

#### 3. Migration: Reset stuck/failed documents
```sql
UPDATE documents SET status = 'pending' 
WHERE status IN ('failed', 'processing');
```

### No changes needed
- Database schema (`vector(768)`) — unchanged due to MRL dimension control
- `search_documents_semantic` RPC — unchanged
- Frontend KnowledgeBase UI — unchanged

### After deployment
- Reprocess failed documents via the "Reprocess Failed" button in admin panel

