import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, language = 'EN' } = await req.json();
    console.log('Processing user file:', fileId, 'language:', language);

    if (!fileId) {
      throw new Error('fileId is required');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get file record
    const { data: fileRecord, error: fileError } = await supabase
      .from('user_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !fileRecord) {
      throw new Error(`File not found: ${fileError?.message}`);
    }

    // Update status to processing
    await supabase
      .from('user_files')
      .update({ status: 'processing' })
      .eq('id', fileId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user_files')
      .download(fileRecord.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    let analysisResult;
    const mimeType = fileRecord.mime_type;

    // For images, use Gemini Vision
    if (mimeType.startsWith('image/')) {
      const base64Data = await blobToBase64(fileData);
      analysisResult = await analyzeWithGeminiVision(base64Data, mimeType, language);
    } else {
      // For documents, extract text and analyze
      const textContent = await extractTextFromFile(fileData, mimeType);
      analysisResult = await analyzeWithGemini(textContent, fileRecord.file_name, language);
    }

    // Update file record with analysis
    const { error: updateError } = await supabase
      .from('user_files')
      .update({
        status: 'processed',
        analysis_result: analysisResult,
        processed_at: new Date().toISOString()
      })
      .eq('id', fileId);

    if (updateError) {
      console.error('Failed to update file record:', updateError);
    }

    console.log('File processed successfully:', fileId);

    return new Response(
      JSON.stringify({ success: true, analysis: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing file:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

async function extractTextFromFile(fileData: Blob, mimeType: string): Promise<string> {
  // For text-based files, extract content directly
  if (mimeType === 'text/plain' || mimeType === 'text/csv' || mimeType === 'application/json') {
    return await fileData.text();
  }
  
  // For PDF and DOCX, we'll send to Gemini for OCR/extraction
  // Since we can't parse these directly in Edge Functions, return placeholder
  return `[Document: ${mimeType}]`;
}

async function analyzeWithGeminiVision(base64Data: string, mimeType: string, language: string): Promise<object> {
  const prompt = getAnalysisPrompt(language, true);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini Vision API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return parseAnalysisResponse(responseText);
}

async function analyzeWithGemini(content: string, fileName: string, language: string): Promise<object> {
  const prompt = `${getAnalysisPrompt(language, false)}

File Name: ${fileName}
Content:
${content.substring(0, 10000)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return parseAnalysisResponse(responseText);
}

function getAnalysisPrompt(language: string, isImage: boolean): string {
  const docType = isImage ? 'image/document' : 'document';
  
  return `You are a legal document analyzer for Indian law. Analyze this ${docType} and provide a structured analysis in JSON format.

Return ONLY a valid JSON object with these fields:
{
  "documentType": "string - type of document (e.g., 'Legal Notice', 'Contract', 'Court Order', 'ID Document', 'Property Document', 'Financial Document', 'Other')",
  "summary": "string - brief 2-3 sentence summary of the document",
  "keyPoints": ["array of key points extracted from the document"],
  "parties": ["array of parties/people mentioned in the document"],
  "dates": ["array of important dates mentioned"],
  "relevantLaws": ["array of potentially relevant Indian laws/acts"],
  "legalImplications": "string - brief note on legal significance",
  "suggestedActions": ["array of suggested next steps for the user"],
  "confidence": "number 0-100 - confidence in the analysis"
}

Language for response: ${language}
Do NOT include markdown formatting. Return ONLY the JSON object.`;
}

function parseAnalysisResponse(responseText: string): object {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse JSON response:', e);
  }
  
  // Fallback structure
  return {
    documentType: 'Unknown',
    summary: responseText.substring(0, 500),
    keyPoints: [],
    parties: [],
    dates: [],
    relevantLaws: [],
    legalImplications: '',
    suggestedActions: [],
    confidence: 50
  };
}
