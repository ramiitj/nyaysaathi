import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map language codes to Google Cloud TTS voice names (Indian voices)
// Neural2 is preferred where available, fallback to Wavenet or Standard
const VOICE_MAP: Record<string, { languageCode: string; name: string }> = {
  'HI': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A' },      // Neural2 available
  'EN': { languageCode: 'en-IN', name: 'en-IN-Neural2-A' },      // Neural2 available
  'BN': { languageCode: 'bn-IN', name: 'bn-IN-Wavenet-A' },      // Wavenet available (no Neural2)
  'TA': { languageCode: 'ta-IN', name: 'ta-IN-Wavenet-A' },      // Wavenet available (no Neural2)
  'TE': { languageCode: 'te-IN', name: 'te-IN-Standard-A' },     // Standard only (no Neural2/Wavenet)
  'MR': { languageCode: 'mr-IN', name: 'mr-IN-Wavenet-A' },      // Wavenet available (no Neural2)
  'GU': { languageCode: 'gu-IN', name: 'gu-IN-Wavenet-A' },      // Wavenet available (no Neural2)
  'KN': { languageCode: 'kn-IN', name: 'kn-IN-Wavenet-A' },      // Wavenet available (no Neural2)
  'ML': { languageCode: 'ml-IN', name: 'ml-IN-Wavenet-A' },      // Wavenet available (no Neural2)
  'PA': { languageCode: 'pa-IN', name: 'pa-IN-Wavenet-A' },      // Wavenet available (no Neural2)
  'OR': { languageCode: 'or-IN', name: 'or-IN-Standard-A' },     // Standard only
  'UR': { languageCode: 'ur-IN', name: 'ur-IN-Wavenet-A' },      // Wavenet available
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

    // Clean text for speech - remove markdown formatting AND all emojis
    const cleanText = text
      .replace(/\*\*/g, '')                    // Remove bold markdown
      .replace(/\*/g, '')                      // Remove italic markdown
      .replace(/#{1,6}\s/g, '')                // Remove heading markers
      .replace(/\[([^\]]+)\]/g, '$1')          // Remove markdown links
      .replace(/\n+/g, ' ')                    // Replace newlines with spaces
      // Remove ALL emojis using Unicode ranges
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // Emoticons (😀-🙏)
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // Misc Symbols & Pictographs (🌀-🗿)
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // Transport & Map (🚀-🛿)
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '')  // Alchemical Symbols
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')  // Geometric Shapes Extended
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')  // Supplemental Arrows-C
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')  // Supplemental Symbols (🤐-🧿)
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')  // Chess Symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')  // Symbols and Pictographs Extended-A
      .replace(/[\u{2600}-\u{26FF}]/gu, '')    // Misc symbols (☀-⛿)
      .replace(/[\u{2700}-\u{27BF}]/gu, '')    // Dingbats (✀-➿)
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')    // Variation Selectors
      .replace(/[\u{200D}]/gu, '')             // Zero Width Joiner
      .replace(/\s+/g, ' ')                    // Collapse multiple spaces
      .trim();

    console.log(`Generating TTS for language: ${language}, voice: ${voiceConfig.name}`);

    // Get access token from service account
    const accessToken = await getAccessToken();

    // Call Google Cloud TTS API with OAuth2 token
    // Using slower speaking rate (0.80) for natural conversational pace
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
            speakingRate: 0.80,  // Slower for natural conversational pace
            pitch: 0,
            volumeGainDb: 2,    // Slightly louder for clarity
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
