
## Plan: Fix Document Counter - Use RPC Function for Accurate Count

### Problem Identified

The count query using `{ count: 'exact', head: true }` is still subject to Supabase's **PostgREST max-rows limit** (default 1000). Even though `head: true` doesn't return data, the count is still capped.

**Evidence from screenshots:**
| Metric | Database Actual | UI Shows |
|--------|-----------------|----------|
| Total Documents | 1,044 | 1,000 |
| Processed Documents | 1,013 | 967 |

### Solution

Create a **database RPC function** that counts documents directly in PostgreSQL, bypassing the API limit.

---

### Changes

#### 1. Create Database Function (Migration)

```sql
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
```

#### 2. Update KnowledgeBase.tsx

Replace the current `fetchDocumentCounts` function:

**Before (lines 90-111):**
```typescript
const fetchDocumentCounts = async () => {
  try {
    const { count: totalCount, error: totalError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    // ... two separate queries
  }
};
```

**After:**
```typescript
const fetchDocumentCounts = async () => {
  try {
    const { data, error } = await supabase.rpc('get_document_counts');
    
    if (error) throw error;
    
    if (data) {
      setTotalDocumentCount(data.total || 0);
      setProcessedDocumentCount(data.processed || 0);
    }
  } catch (err) {
    console.error('Error fetching document counts:', err);
  }
};
```

---

### Why This Works

| Aspect | Current Approach | New Approach |
|--------|------------------|--------------|
| Query type | PostgREST API with `head: true` | Direct PostgreSQL RPC |
| Subject to max-rows? | Yes (capped at 1000) | No (runs in database) |
| Number of API calls | 2 (total + processed) | 1 (single RPC) |
| Performance | Slower (2 round trips) | Faster (1 round trip) |

---

### Files to Modify

| File | Changes |
|------|---------|
| New migration | Add `get_document_counts()` function |
| `src/components/admin/KnowledgeBase.tsx` | Update `fetchDocumentCounts` to use RPC |

---

### Expected Outcome

After this change:
- Total document count will show **1,044** (actual count)
- Processed document count will show **1,013** (actual count)
- Counts update in real-time when documents are added/processed/deleted
- Single efficient database call for all counts
