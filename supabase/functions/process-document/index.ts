import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CHUNK_SIZE = 500; // tokens (approximate)
const CHUNK_OVERLAP = 50;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download document');
    }

    // Convert file to base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Use Gemini to extract text and analyze document
    const extractResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!extractResponse.ok) {
      const error = await extractResponse.text();
      console.error('Gemini extraction error:', error);
      throw new Error('Failed to extract document content');
    }

    const extractData = await extractResponse.json();
    let extractedContent;
    
    try {
      const responseText = extractData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Try to parse JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedContent = JSON.parse(jsonMatch[0]);
      } else {
        extractedContent = {
          text_content: responseText,
          topics: [],
          rules: [],
          legal_references: []
        };
      }
    } catch (e) {
      console.error('Failed to parse extraction response:', e);
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

    console.log(`Created ${chunks.length} chunks from document`);

    // Generate embeddings for each chunk using Gemini
    const embeddings: Array<{ chunk_index: number; content: string; embedding: number[] }> = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embeddingResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: {
                parts: [{ text: chunks[i] }]
              }
            })
          }
        );

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.embedding?.values;
          
          if (embedding) {
            embeddings.push({
              chunk_index: i,
              content: chunks[i],
              embedding
            });
          }
        }
      } catch (e) {
        console.error(`Failed to generate embedding for chunk ${i}:`, e);
      }
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
          topics: extractedContent.topics 
        }
      }));

      const { error: insertError } = await supabase
        .from('document_embeddings')
        .insert(embeddingRecords);

      if (insertError) {
        console.error('Failed to insert embeddings:', insertError);
      }
    }

    // Update document with extracted info
    await supabase
      .from('documents')
      .update({
        status: 'processed',
        topics_extracted: extractedContent.topics,
        rules_extracted: extractedContent.rules,
        chunk_count: embeddings.length,
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    console.log(`Successfully processed document ${documentId} with ${embeddings.length} embeddings`);

    return new Response(
      JSON.stringify({ 
        success: true,
        chunks: embeddings.length,
        topics: extractedContent.topics,
        rules: extractedContent.rules
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error processing document:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Update document status to failed
    if (req.body) {
      try {
        const { documentId } = await req.clone().json();
        if (documentId) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          await supabase
            .from('documents')
            .update({ status: 'failed' })
            .eq('id', documentId);
        }
      } catch (e) {
        console.error('Failed to update document status:', e);
      }
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
