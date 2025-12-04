import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map language codes to Google Cloud TTS Neural2 voice names
const VOICE_MAP: Record<string, { languageCode: string; name: string }> = {
  'HI': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A' },
  'EN': { languageCode: 'en-IN', name: 'en-IN-Neural2-A' },
  'BN': { languageCode: 'bn-IN', name: 'bn-IN-Neural2-A' },
  'TA': { languageCode: 'ta-IN', name: 'ta-IN-Neural2-A' },
  'TE': { languageCode: 'te-IN', name: 'te-IN-Neural2-A' },
  'MR': { languageCode: 'mr-IN', name: 'mr-IN-Neural2-A' },
  'GU': { languageCode: 'gu-IN', name: 'gu-IN-Neural2-A' },
  'KN': { languageCode: 'kn-IN', name: 'kn-IN-Neural2-A' },
  'ML': { languageCode: 'ml-IN', name: 'ml-IN-Neural2-A' },
  'PA': { languageCode: 'pa-IN', name: 'pa-IN-Neural2-A' },
  'OR': { languageCode: 'or-IN', name: 'or-IN-Standard-A' },
  'UR': { languageCode: 'ur-IN', name: 'ur-IN-Standard-A' },
};

// Generate OAuth2 access token from service account credentials
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const privateKeyPem = serviceAccount.private_key;
  
  // Import the private key
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

  // Exchange JWT for access token
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
    const { text, language } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const voiceConfig = VOICE_MAP[language] || VOICE_MAP['EN'];

    // Clean text for speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]/g, '$1')
      .replace(/⚠️/g, 'Warning: ')
      .replace(/\n+/g, ' ')
      .trim();

    console.log(`Generating TTS for language: ${language}, voice: ${voiceConfig.name}`);

    // Get access token from service account
    const accessToken = await getAccessToken();

    // Call Google Cloud TTS API with OAuth2 token
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
            speakingRate: 0.95,
            pitch: 0,
            volumeGainDb: 0,
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
