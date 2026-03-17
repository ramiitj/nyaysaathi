

## Plan: Fix Chunk Creation in RAG Document Processing

### Problem Identified

After investigating the database, the situation is:

| Metric | Count |
|--------|-------|
| Total processed documents | 1,444 |
| Processed WITH chunks | 1,423 |
| Processed with 0 chunks | 21 |
| Total embeddings stored | 7,706 |
| Pending documents | 9 |
| Failed documents | 23 |

The pipeline is **mostly working** -- 98.5% of processed documents have chunks. However, there are two distinct issues:

**Issue 1: 21 documents marked "processed" but have 0 chunks.** These were processed recently (March 5, ~09:56-09:57 UTC) in rapid succession. The likely cause: when many documents are processed simultaneously, Gemini API rate limits cause all embedding requests to fail silently. The function still marks the document as "processed" with `chunk_count: 0` instead of "failed".

**Issue 2: "Total Chunks" stat in the UI is computed from `documents` array (capped at 1,000 rows)**, not from the database total -- same pagination bug we fixed for document counts.

**Issue 3: 9 pending + 23 failed documents are stuck** with no way to batch-reprocess them.

---

### Solution

#### 1. Fix the edge function: Don't mark as "processed" if 0 chunks were created

**File:** `supabase/functions/process-document/index.ts` (lines 319-329)

Change the final status update to mark documents as "failed" if no embeddings were generated:

```typescript
// Before: always marks as 'processed'
await supabase.from('documents').update({
  status: 'processed',
  chunk_count: embeddings.length,
  ...
});

// After: mark as 'failed' if no chunks
await supabase.from('documents').update({
  status: embeddings.length > 0 ? 'processed' : 'failed',
  chunk_count: embeddings.length,
  ...
});
```

Also increase `maxOutputTokens` from 8192 to 65536 to extract more text from large documents, and add retry logic for embedding API failures.

#### 2. Add "Total Chunks" to the RPC function

Update `get_document_counts()` to also return total chunk count, so it's not limited by the 1,000 row fetch.

**Migration SQL:**
```sql
CREATE OR REPLACE FUNCTION public.get_document_counts()
RETURNS jsonb ...
AS $$
  -- Add: 'total_chunks', (SELECT COALESCE(SUM(chunk_count), 0) FROM documents WHERE status = 'processed')
$$;
```

#### 3. Add a "Reprocess Failed" button in KnowledgeBase UI

Add a button to reprocess all documents with `status = 'failed'` or `chunk_count = 0`, processing them sequentially with a delay to avoid rate limits.

#### 4. Fix the totalChunks stat to use RPC data

Replace the client-side `totalChunks` calculation (line 315) with the value from the RPC function.

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/process-document/index.ts` | Mark 0-chunk docs as failed; increase maxOutputTokens; add embedding retry |
| New migration | Update `get_document_counts()` to include total_chunks |
| `src/components/admin/KnowledgeBase.tsx` | Use RPC for totalChunks; add "Reprocess Failed" button |

---

### Expected Outcome

- Documents with 0 chunks will be correctly marked as "failed" instead of "processed"
- Total Chunks stat will show the accurate database total
- Admin can reprocess failed/stuck documents with one click
- Embedding generation will retry once on failure before giving up

