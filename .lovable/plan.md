

## Plan: Fix RAG Pipeline, Update Gemini Model, and Remove Date from Landing Page

This plan addresses three issues to get the backend fully functional and clean up the UI.

---

### Issue Summary

| Issue | Current State | Fix |
|-------|---------------|-----|
| Gemini Model Error | Using `gemini-2.0-flash-exp` (404 error) | Update to `gemini-2.5-flash` |
| RAG Search Not Working | `search_documents_semantic` function missing | Create the database function |
| DatePicker on Landing Page | Shows unnecessary date picker | Remove DatePicker component |

---

### Changes Required

#### 1. Update Gemini Model in Edge Function

**File:** `supabase/functions/legal-chat/index.ts`

| Line | Current | New |
|------|---------|-----|
| 422 | `gemini-2.0-flash-exp` | `gemini-2.5-flash` |

```typescript
// Line 422 - Change model name
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
```

---

#### 2. Create `search_documents_semantic` Database Function

**Type:** Database Migration

This function enables vector similarity search using the existing embeddings in `document_embeddings` table.

```sql
CREATE OR REPLACE FUNCTION search_documents_semantic(
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.document_id,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) as similarity
  FROM document_embeddings de
  WHERE de.embedding IS NOT NULL
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

This function:
- Takes a 768-dimension vector (matching text-embedding-004 output)
- Uses cosine distance (`<=>` operator) for similarity search
- Returns top N matching chunks with similarity scores
- Works with the existing 5,678 embeddings already in the database

---

#### 3. Remove DatePicker from Landing Page

**File:** `src/pages/Landing.tsx`

| Line(s) | Action |
|---------|--------|
| 10-11 | Remove DatePicker import and CSS |
| 18 | Remove `startDate` state |
| 80-81 | Remove DatePicker component from JSX |

**Before (lines 10-11):**
```typescript
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
```

**After:** (removed entirely)

**Before (line 18):**
```typescript
const [startDate, setStartDate] = useState(new Date());
```

**After:** (removed entirely)

**Before (lines 80-81):**
```tsx
{/* DatePicker */}
<DatePicker selected={startDate} onChange={(date:Date) => setStartDate(date)} />
```

**After:** (removed entirely)

---

### Implementation Order

1. Create the `search_documents_semantic` database function (migration)
2. Update the Gemini model name in `legal-chat` edge function
3. Remove DatePicker from Landing page

---

### Expected Outcome

After these changes:
- Chat will use the valid `gemini-2.5-flash` model (no more 404 errors)
- User queries will use semantic vector search against 5,678 embeddings
- RAG context will be properly injected into AI responses
- Landing page will be cleaner without the unnecessary date picker

