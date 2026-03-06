

## Update GEMINI_API_KEY Secret

### What will happen
1. Use the secret management tool to prompt you to paste your new Gemini API key
2. The key will be securely stored and immediately available to all edge functions (process-document, legal-chat, etc.)
3. No code changes needed — the existing functions already reference `GEMINI_API_KEY`

### After updating
- You can reprocess failed documents from the Knowledge Base admin panel using the "Reprocess Failed" button
- New document uploads will use the updated key for both text extraction and embedding generation

