

## Plan: Fix Document Counter Beyond 1000 Limit

### Problem
Supabase has a **default limit of 1,000 rows** per query. The Knowledge Base UI fetches documents without specifying a range, so it only gets the first 1,000 documents and displays that count.

**Actual documents in database:** 1,035
**Documents shown in UI:** 1,000 (capped by default limit)

---

### Solution

Use a **separate count query** for the document total instead of relying on the fetched array length. Keep the document list paginated (for performance) but show the accurate total count.

**File:** `src/components/admin/KnowledgeBase.tsx`

---

### Changes

#### 1. Add a new state for total document count

```typescript
// Line ~30, add new state
const [totalDocumentCount, setTotalDocumentCount] = useState<number>(0);
```

#### 2. Create a separate count query function

```typescript
const fetchDocumentCount = async () => {
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    setTotalDocumentCount(count || 0);
  } catch (err) {
    console.error('Error fetching document count:', err);
  }
};
```

#### 3. Update fetchDocuments to also fetch count

Call `fetchDocumentCount()` alongside `fetchDocuments()` in the useEffect and after uploads/deletes.

#### 4. Update the document list header display

```typescript
// Line ~431, change from:
<CardTitle>Documents ({documents.length})</CardTitle>

// To:
<CardTitle>Documents ({totalDocumentCount})</CardTitle>
```

#### 5. Update training stats to use accurate count

For the "Documents Processed" stat, we also need to fetch the count of processed documents separately:

```typescript
const fetchProcessedCount = async () => {
  const { count, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processed');
  
  if (!error) setProcessedDocumentCount(count || 0);
};
```

---

### Technical Details

| Aspect | Before | After |
|--------|--------|-------|
| Count source | `documents.length` (capped at 1000) | `SELECT count(*)` query (no limit) |
| Supabase method | `select('*')` | `select('*', { count: 'exact', head: true })` |
| Performance | Fetches all data | Count query returns only number |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/KnowledgeBase.tsx` | Add count states, count fetch functions, update displays |

---

### Expected Outcome

- Document counter will show the **accurate total** (1,035+) regardless of how many documents exist
- The document table will still show paginated results (for performance)
- Stats like "Documents Processed" will also use accurate counts
- Real-time updates will refresh both the list and the count

