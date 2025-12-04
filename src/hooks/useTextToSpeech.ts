import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LanguageCode } from '@/config/languages';

// Browser TTS language code mapping
const TTS_LANG_MAP: Record<LanguageCode, string> = {
  'HI': 'hi-IN',
  'EN': 'en-IN',
  'BN': 'bn-IN',
  'TA': 'ta-IN',
  'TE': 'te-IN',
  'MR': 'mr-IN',
  'GU': 'gu-IN',
  'KN': 'kn-IN',
  'ML': 'ml-IN',
  'PA': 'pa-IN',
  'OR': 'or-IN',
  'UR': 'ur-IN'
};

interface UseTextToSpeechOptions {
  language: LanguageCode;
}

export const useTextToSpeech = ({ language }: UseTextToSpeechOptions) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

    setIsLoading(true);

    try {
      // Get cleaned text from backend
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
      });

      if (error) throw error;

      const cleanText = data.text || text;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Use browser's built-in TTS
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = TTS_LANG_MAP[language] || 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith(TTS_LANG_MAP[language]?.split('-')[0] || 'en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('TTS error:', err);
      setIsLoading(false);
      
      // Fallback to basic browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = TTS_LANG_MAP[language] || 'en-IN';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  }, [language]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading
  };
};
