import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Map language codes to Google Cloud TTS voice names
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // For TTS, we'll use Gemini to generate a more natural spoken version
    // then use the browser's built-in TTS or return SSML for client-side synthesis
    
    const voiceConfig = VOICE_MAP[language] || VOICE_MAP['EN'];

    // Clean text for speech (remove markdown, citations brackets, etc.)
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]/g, '$1')
      .replace(/⚠️/g, 'Warning: ')
      .trim();

    // Return the cleaned text with voice configuration for client-side TTS
    // This is more efficient than server-side audio generation
    return new Response(
      JSON.stringify({ 
        text: cleanText,
        voiceConfig,
        ssml: `<speak>${cleanText}</speak>`
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
