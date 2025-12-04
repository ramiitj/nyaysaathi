import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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
    const { audio, language } = await req.json();

    if (!audio) {
      throw new Error('Audio data is required');
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const languageHint = LANGUAGE_HINTS[language] || 'English';

    // Use Gemini's multimodal capabilities for speech-to-text
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
                text: `Transcribe the audio above accurately. The speaker is likely speaking in ${languageHint} (Indian context). Return ONLY the transcribed text, nothing else. If you cannot understand the audio, return an empty string.`
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
    const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

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
