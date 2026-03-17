import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CHUNK_SIZE = 500; // tokens (approximate)
const CHUNK_OVERLAP = 50;
const EMBEDDING_BATCH_SIZE = 5; // Process embeddings in batches

// Helper function to log with timestamp and document context
const createLogger = (documentId: string, documentName: string) => ({
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(`[${new Date().toISOString()}] [DOC:${documentId.slice(0, 8)}] [${documentName}] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`[${new Date().toISOString()}] [DOC:${documentId.slice(0, 8)}] [${documentName}] ERROR: ${message}`, error);
  },
  progress: (step: string, current: number, total: number) => {
    const percent = Math.round((current / total) * 100);
    console.log(`[${new Date().toISOString()}] [DOC:${documentId.slice(0, 8)}] PROGRESS: ${step} - ${current}/${total} (${percent}%)`);
  }
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let documentId = '';
  let logger = { 
    info: console.log, 
    error: console.error, 
    progress: console.log 
  };

  try {
    const body = await req.json();
    documentId = body.documentId;

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get document record
    logger.info('Fetching document record...');
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || 'Unknown error'}`);
    }

    // Initialize proper logger with document name
    logger = createLogger(documentId, document.name);
    logger.info('Starting document processing', { 
      fileSize: document.file_size,
      mimeType: document.mime_type 
    });

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Download file from storage
    logger.info('Downloading document from storage...');
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download document: ${downloadError?.message || 'Unknown error'}`);
    }

    logger.info('Document downloaded successfully', { size: fileData.size });

    // Convert file to base64 for Gemini (chunked to avoid stack overflow on large files)
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    const chunkSize = 8192; // Process 8KB chunks at a time
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Content = btoa(binaryString);
    logger.info('File converted to base64', { base64Length: base64Content.length });

    // Use Gemini to extract text and analyze document
    logger.info('Sending document to Gemini for extraction...');
    const extractResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: document.mime_type || 'application/pdf',
                  data: base64Content
                }
              },
              {
                text: `Analyze this legal document and extract:
1. ALL text content from the document (preserve structure)
2. Key topics discussed (as a JSON array of strings)
3. Behavioral rules or guidelines mentioned (as a JSON array of strings)
4. Important legal references (acts, sections, case laws)

Return your response in this exact JSON format:
{
  "text_content": "full extracted text here",
  "topics": ["topic1", "topic2"],
  "rules": ["rule1", "rule2"],
  "legal_references": ["reference1", "reference2"]
}`
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 65536,
          }
        })
      }
    );

    if (!extractResponse.ok) {
      const error = await extractResponse.text();
      logger.error('Gemini extraction failed', { status: extractResponse.status, error });
      throw new Error(`Gemini extraction failed: ${extractResponse.status}`);
    }

    const extractData = await extractResponse.json();
    logger.info('Gemini extraction complete');

    let extractedContent;
    
    try {
      const responseText = extractData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Try to parse JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedContent = JSON.parse(jsonMatch[0]);
        logger.info('Successfully parsed JSON response', { 
          topicsCount: extractedContent.topics?.length || 0,
          rulesCount: extractedContent.rules?.length || 0,
          textLength: extractedContent.text_content?.length || 0
        });
      } else {
        logger.info('No JSON found in response, using raw text');
        extractedContent = {
          text_content: responseText,
          topics: [],
          rules: [],
          legal_references: []
        };
      }
    } catch (e) {
      logger.error('Failed to parse extraction response', e);
      extractedContent = {
        text_content: extractData.candidates?.[0]?.content?.parts?.[0]?.text || '',
        topics: [],
        rules: [],
        legal_references: []
      };
    }

    // Chunk the text content
    const textContent = extractedContent.text_content || '';
    const words = textContent.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
      const chunk = words.slice(i, i + CHUNK_SIZE).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }

    logger.info('Text chunking complete', { 
      totalWords: words.length,
      chunksCreated: chunks.length,
      chunkSize: CHUNK_SIZE,
      overlap: CHUNK_OVERLAP
    });

    // Generate embeddings for each chunk using Gemini (in batches)
    const embeddings: Array<{ chunk_index: number; content: string; embedding: number[] }> = [];
    const totalChunks = chunks.length;
    
    for (let batchStart = 0; batchStart < chunks.length; batchStart += EMBEDDING_BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + EMBEDDING_BATCH_SIZE, chunks.length);
      const batch = chunks.slice(batchStart, batchEnd);
      
      logger.progress('Embedding generation', batchEnd, totalChunks);
      
    // Process batch in parallel with retry
      const generateEmbeddingWithRetry = async (chunk: string, globalIndex: number, retries = 1): Promise<{ chunk_index: number; content: string; embedding: number[] } | null> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            if (attempt > 0) {
              logger.info(`Retrying embedding for chunk ${globalIndex} (attempt ${attempt + 1})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            const embeddingResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-exp-03-07:embedContent?key=${GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'models/gemini-embedding-exp-03-07',
                  content: {
                    parts: [{ text: chunk }]
                  },
                  outputDimensionality: 768,
                  taskType: 'RETRIEVAL_DOCUMENT'
                  }
                })
              }
            );

            if (embeddingResponse.ok) {
              const embeddingData = await embeddingResponse.json();
              const embedding = embeddingData.embedding?.values;
              if (embedding) {
                return { chunk_index: globalIndex, content: chunk, embedding };
              }
            } else {
              const status = embeddingResponse.status;
              logger.error(`Embedding API error for chunk ${globalIndex}`, { status, attempt });
              // Don't retry on 4xx errors (except 429 rate limit)
              if (status >= 400 && status < 500 && status !== 429) break;
            }
          } catch (e) {
            logger.error(`Failed to generate embedding for chunk ${globalIndex} (attempt ${attempt + 1})`, e);
          }
        }
        return null;
      };

      const batchPromises = batch.map((chunk, batchIndex) => {
        const globalIndex = batchStart + batchIndex;
        return generateEmbeddingWithRetry(chunk, globalIndex);
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        if (result) embeddings.push(result);
      });

      // Delay between batches to avoid rate limiting
      if (batchEnd < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    logger.info('Embedding generation complete', { 
      successfulEmbeddings: embeddings.length,
      totalChunks: chunks.length,
      successRate: `${Math.round((embeddings.length / Math.max(chunks.length, 1)) * 100)}%`
    });

    // Delete any existing embeddings for this document (in case of reprocessing)
    const { error: deleteError } = await supabase
      .from('document_embeddings')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) {
      logger.error('Failed to delete existing embeddings', deleteError);
    }

    // Store embeddings in database
    if (embeddings.length > 0) {
      const embeddingRecords = embeddings.map(e => ({
        document_id: documentId,
        chunk_index: e.chunk_index,
        content: e.content,
        embedding: `[${e.embedding.join(',')}]`,
        metadata: { 
          document_name: document.name,
          topics: extractedContent.topics,
          legal_references: extractedContent.legal_references
        }
      }));

      // Insert in batches to avoid payload size limits
      const insertBatchSize = 50;
      for (let i = 0; i < embeddingRecords.length; i += insertBatchSize) {
        const batch = embeddingRecords.slice(i, i + insertBatchSize);
        const { error: insertError } = await supabase
          .from('document_embeddings')
          .insert(batch);

        if (insertError) {
          logger.error(`Failed to insert embeddings batch ${i / insertBatchSize}`, insertError);
        } else {
          logger.info(`Inserted embeddings batch ${Math.floor(i / insertBatchSize) + 1}`, { 
            count: batch.length 
          });
        }
      }
    }

    // Update document with extracted info - mark as failed if no chunks created
    const finalStatus = embeddings.length > 0 ? 'processed' : 'failed';
    if (finalStatus === 'failed') {
      logger.error('No embeddings generated - marking document as failed', {
        chunksAttempted: chunks.length,
        embeddingsCreated: embeddings.length
      });
    }
    await supabase
      .from('documents')
      .update({
        status: finalStatus,
        topics_extracted: extractedContent.topics,
        rules_extracted: extractedContent.rules,
        chunk_count: embeddings.length,
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info('Document processing complete', { 
      processingTimeSeconds: processingTime,
      embeddingsStored: embeddings.length,
      topicsExtracted: extractedContent.topics?.length || 0,
      rulesExtracted: extractedContent.rules?.length || 0
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        chunks: embeddings.length,
        topics: extractedContent.topics,
        rules: extractedContent.rules,
        legal_references: extractedContent.legal_references,
        processingTimeSeconds: parseFloat(processingTime)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.error('Document processing failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeSeconds: processingTime
    });
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Update document status to failed
    if (documentId) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from('documents')
          .update({ status: 'failed' })
          .eq('id', documentId);
      } catch (e) {
        logger.error('Failed to update document status to failed', e);
      }
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
