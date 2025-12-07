import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ RATE LIMITING ============
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT = { windowMs: 60000, maxRequests: 20 };

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('cf-connecting-ip') ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function checkRateLimit(identifier: string): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const key = `tts:${identifier}`;
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

function sanitizeString(str: string, maxLength = 5000): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function validateInput(body: any): { valid: boolean; text?: string; language?: string; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { text, language } = body;

  if (typeof text !== 'string' || text.trim().length === 0) {
    return { valid: false, error: 'Text is required' };
  }

  if (text.length > 5000) {
    return { valid: false, error: 'Text exceeds maximum length of 5000 characters' };
  }

  let validatedLanguage = 'EN';
  if (language && typeof language === 'string') {
    if (!VALID_LANGUAGES.includes(language.toUpperCase())) {
      return { valid: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  return { valid: true, text: sanitizeString(text, 5000), language: validatedLanguage };
}

// Map language codes to Google Cloud TTS voice names (Indian voices)
const VOICE_MAP: Record<string, { languageCode: string; name: string }> = {
  'HI': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A' },
  'EN': { languageCode: 'en-IN', name: 'en-IN-Neural2-A' },
  'BN': { languageCode: 'bn-IN', name: 'bn-IN-Wavenet-A' },
  'TA': { languageCode: 'ta-IN', name: 'ta-IN-Wavenet-A' },
  'TE': { languageCode: 'te-IN', name: 'te-IN-Standard-A' },
  'MR': { languageCode: 'mr-IN', name: 'mr-IN-Wavenet-A' },
  'GU': { languageCode: 'gu-IN', name: 'gu-IN-Wavenet-A' },
  'KN': { languageCode: 'kn-IN', name: 'kn-IN-Wavenet-A' },
  'ML': { languageCode: 'ml-IN', name: 'ml-IN-Wavenet-A' },
  'PA': { languageCode: 'pa-IN', name: 'pa-IN-Wavenet-A' },
  'OR': { languageCode: 'or-IN', name: 'or-IN-Standard-A' },
  'UR': { languageCode: 'ur-IN', name: 'ur-IN-Wavenet-A' },
};

// Generate OAuth2 access token from service account credentials
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const privateKeyPem = serviceAccount.private_key;
  
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKeyPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const now = Math.floor(Date.now() / 1000);
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    cryptoKey
  );

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Token exchange error:", error);
    throw new Error("Failed to get access token");
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
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

    const { text, language } = validation;
    const voiceConfig = VOICE_MAP[language!] || VOICE_MAP['EN'];

    // Clean text for speech - remove markdown formatting AND all emojis
    const cleanText = text!
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]/g, '$1')
      .replace(/\n+/g, ' ')
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '')
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
      .replace(/[\u{200D}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`Generating TTS for language: ${language}, voice: ${voiceConfig.name}`);

    const accessToken = await getAccessToken();

    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: cleanText },
          voice: {
            languageCode: voiceConfig.languageCode,
            name: voiceConfig.name,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.80,
            pitch: 0,
            volumeGainDb: 2,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google TTS API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to generate speech');
    }

    const result = await response.json();
    console.log('TTS generated successfully');

    return new Response(
      JSON.stringify({ 
        audioContent: result.audioContent,
        voiceConfig,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in text-to-speech:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
