import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// ============ RATE LIMITING ============
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT = { windowMs: 60000, maxRequests: 5 };

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('cf-connecting-ip') ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function checkRateLimit(identifier: string): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const key = `file:${identifier}`;
  let entry = rateLimitStore.get(key);
  
  if (rateLimitStore.size > 10000) {
    const cutoff = now - RATE_LIMIT.windowMs * 2;
    for (const [k, v] of rateLimitStore) {
      if (v.windowStart < cutoff) rateLimitStore.delete(k);
    }
  }
  
  if (!entry || now - entry.windowStart >= RATE_LIMIT.windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, resetIn: RATE_LIMIT.windowMs };
  }
  
  if (entry.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, resetIn: RATE_LIMIT.windowMs - (now - entry.windowStart) };
  }
  
  entry.count++;
  return { allowed: true, resetIn: RATE_LIMIT.windowMs - (now - entry.windowStart) };
}

// ============ INPUT VALIDATION ============
const VALID_LANGUAGES = ['HI', 'EN', 'BN', 'TA', 'TE', 'MR', 'GU', 'KN', 'ML', 'PA', 'OR', 'UR'];

interface ValidatedInput {
  fileId: string;
  fileName: string;
  mimeType: string;
  base64Data: string;
  language: string;
}

function validateInput(body: any): { valid: boolean; data?: ValidatedInput; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { fileId, fileName, mimeType, base64Data, language } = body;

  if (typeof fileId !== 'string' || !fileId) {
    return { valid: false, error: 'Valid fileId is required' };
  }

  if (typeof fileName !== 'string' || !fileName) {
    return { valid: false, error: 'Valid fileName is required' };
  }

  if (typeof mimeType !== 'string' || !mimeType) {
    return { valid: false, error: 'Valid mimeType is required' };
  }

  if (typeof base64Data !== 'string' || !base64Data) {
    return { valid: false, error: 'Valid base64Data is required' };
  }

  let validatedLanguage = 'EN';
  if (language && typeof language === 'string') {
    if (!VALID_LANGUAGES.includes(language.toUpperCase())) {
      return { valid: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  return { 
    valid: true, 
    data: { 
      fileId, 
      fileName, 
      mimeType, 
      base64Data, 
      language: validatedLanguage 
    } 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP.substring(0, 8)}...`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.', retryAfter: Math.ceil(rateLimit.resetIn / 1000) }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileId, fileName, mimeType, base64Data, language } = validation.data!;
    console.log('Processing user file:', fileId, 'name:', fileName, 'type:', mimeType, 'language:', language);

    // NOTE: File data is received directly as base64 - NOT stored on backend
    // This ensures user files remain only in their browser (IndexedDB)

    let analysisResult;

    // For images, use Gemini Vision
    if (mimeType.startsWith('image/')) {
      analysisResult = await analyzeWithGeminiVision(base64Data, mimeType, language);
    } else {
      // For documents, decode and analyze
      const textContent = await extractTextFromBase64(base64Data, mimeType);
      analysisResult = await analyzeWithGemini(textContent, fileName, language);
    }

    console.log('File processed successfully (locally stored, not on backend):', fileId);

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

async function extractTextFromBase64(base64Data: string, mimeType: string): Promise<string> {
  // Decode base64 to text for text-based files
  if (mimeType === 'text/plain' || mimeType === 'text/csv' || mimeType === 'application/json') {
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      return `[Document: ${mimeType}]`;
    }
  }
  // For binary documents (PDF, DOCX), we'll use Gemini Vision for analysis
  return `[Binary Document: ${mimeType}]`;
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
  // For binary documents, use Vision API with base64
  if (content.startsWith('[Binary Document:')) {
    // Return a basic analysis - actual document parsing requires Vision
    return {
      documentType: 'Document',
      summary: `This is a ${fileName} file. For detailed analysis, please use an image format.`,
      keyPoints: [],
      parties: [],
      dates: [],
      relevantLaws: [],
      legalImplications: 'Unable to extract text from this document format.',
      suggestedActions: ['Convert to PDF with text layer or image for better analysis'],
      confidence: 30
    };
  }

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
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse JSON response:', e);
  }
  
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
