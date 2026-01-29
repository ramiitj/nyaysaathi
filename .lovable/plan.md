

## Plan: Fix Document Processing in Knowledge Base

### Problem Identified

The `process-document` edge function is failing with 404 errors because it's using the deprecated `gemini-2.0-flash-exp` model (same issue we fixed in `legal-chat`).

**Error from logs:**
```
"models/gemini-2.0-flash-exp is not found for API version v1beta"
```

**Location:** `supabase/functions/process-document/index.ts` - Line 112

---

### Solution

Update the Gemini model from `gemini-2.0-flash-exp` to `gemini-2.5-flash` in the process-document edge function.

**File:** `supabase/functions/process-document/index.ts`

| Line | Current | New |
|------|---------|-----|
| 112 | `gemini-2.0-flash-exp` | `gemini-2.5-flash` |

**Before (line 112):**
```typescript
const extractResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
```

**After:**
```typescript
const extractResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
```

---

### What This Fixes

After this change:
- Document upload and processing will work correctly
- PDFs will be extracted using Gemini 2.5 Flash
- Text will be chunked and embeddings will be generated
- All 908 pending documents can be processed
- The RAG knowledge base will be populated with legal document content

---

### Implementation

Single file change - update the model name on line 112 of the edge function.

