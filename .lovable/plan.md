

## Fix RAG Pipeline — Switch to Available Embedding Model

### Root Cause
`gemini-embedding-exp-03-07` was **deprecated and removed** from the Gemini API on August 14, 2025. That's why every embedding call returns 404. This affects both document processing and query embedding in legal-chat.

### Solution
Switch to **`gemini-embedding-001`** (GA, stable) in both edge functions. This model supports `outputDimensionality: 768` and `taskType` parameters, so it's fully compatible with the existing database schema and RPC functions — no migration needed.

### Changes

| File | What changes |
|------|-------------|
| `supabase/functions/process-document/index.ts` (~line 229, 234) | Replace `gemini-embedding-exp-03-07` → `gemini-embedding-001` in URL and model field |
| `supabase/functions/legal-chat/index.ts` (~line 244, 249) | Replace `gemini-embedding-exp-03-07` → `gemini-embedding-001` in URL and model field |

### Specific edits

**process-document/index.ts** (2 occurrences):
```
URL:   models/gemini-embedding-001:embedContent
body:  model: 'models/gemini-embedding-001'
```

**legal-chat/index.ts** (2 occurrences):
```
URL:   models/gemini-embedding-001:embedContent
body:  model: 'models/gemini-embedding-001'
```

Everything else (`outputDimensionality: 768`, `taskType`, vector column, RPC) stays unchanged.

### After deployment
- Deploy both functions
- Reset stuck documents: `UPDATE documents SET status = 'pending' WHERE status IN ('failed', 'processing');`
- Use "Reprocess Failed" button in Knowledge Base admin

