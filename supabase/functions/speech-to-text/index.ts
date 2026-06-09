import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
const RATE_LIMIT = { windowMs: 60000, maxRequests: 30 };

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('cf-connecting-ip') ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function checkRateLimit(identifier: string): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const key = `stt:${identifier}`;
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

function validateInput(body: any): { valid: boolean; audio?: string; language?: string; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { audio, language } = body;

  if (typeof audio !== 'string' || audio.length === 0) {
    return { valid: false, error: 'Audio data is required' };
  }

  // Max ~10MB base64
  if (audio.length > 15000000) {
    return { valid: false, error: 'Audio data exceeds maximum size' };
  }

  // Validate base64 format
  if (!/^[A-Za-z0-9+/=]+$/.test(audio)) {
    return { valid: false, error: 'Invalid audio data format' };
  }

  let validatedLanguage = 'EN';
  if (language && typeof language === 'string') {
    if (!VALID_LANGUAGES.includes(language.toUpperCase())) {
      return { valid: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  return { valid: true, audio, language: validatedLanguage };
}

// Language code to name mapping for better transcription hints
const LANGUAGE_HINTS: Record<string, string> = {
  'HI': 'Hindi',
  'EN': 'English',
  'BN': 'Bengali',
  'TA': 'Tamil',
  'TE': 'Telugu',
  'MR': 'Marathi',
  'GU': 'Gujarati',
  'KN': 'Kannada',
  'ML': 'Malayalam',
  'PA': 'Punjabi',
  'OR': 'Odia',
  'UR': 'Urdu'
};

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

    const { audio, language } = validation;

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const languageHint = LANGUAGE_HINTS[language!] || 'English';

    // Use Gemini's multimodal capabilities for speech-to-text
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: audio
                }
              },
              {
                text: `Transcribe the audio above accurately. The speaker is likely speaking in ${languageHint} (Indian context).

IMPORTANT RULES:
1. Return ONLY the spoken words, nothing else
2. If there is no clear speech (just noise, silence, breathing, or unintelligible sounds), return exactly: ""
3. Do NOT return dots, dashes, periods, or placeholder text
4. Do NOT describe what you hear, only transcribe actual spoken words
5. Do NOT add punctuation unless clearly spoken
6. Minimum valid transcription should be at least 2 actual words

If you cannot understand clear speech, return an empty string "".`
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini transcription error:', error);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    let transcription = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    // Validate transcription - reject garbage patterns
    const isGarbage = (text: string) => {
      if (!text) return true;
      if (/^[.\-\s]+$/.test(text)) return true;
      if (text.length < 3) return true;
      const alphaCount = (text.match(/[a-zA-Z\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0600-\u06FF]/g) || []).length;
      if (alphaCount < text.length * 0.3) return true;
      return false;
    };
    
    if (isGarbage(transcription)) {
      transcription = '';
    }

    console.log('Transcription result:', transcription);

    return new Response(
      JSON.stringify({ text: transcription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in speech-to-text:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
