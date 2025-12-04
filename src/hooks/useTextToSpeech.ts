import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LanguageCode } from '@/config/languages';

// Browser TTS language code mapping (fallback)
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

    setIsLoading(true);

    try {
      // Call Google Cloud TTS via edge function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
      });

      if (error) throw error;

      if (!data.audioContent) {
        throw new Error('No audio content received');
      }

      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create audio from base64
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;

      audio.onloadstart = () => {
        setIsLoading(true);
      };

      audio.oncanplay = () => {
        setIsLoading(false);
      };

      audio.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        setIsLoading(false);
        audioRef.current = null;
      };

      await audio.play();

    } catch (err) {
      console.error('TTS error:', err);
      setIsLoading(false);
      
      // Fallback to browser TTS
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = TTS_LANG_MAP[language] || 'en-IN';
        utterance.rate = 0.9;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      } catch (fallbackErr) {
        console.error('Browser TTS fallback also failed:', fallbackErr);
      }
    }
  }, [language]);

  const stop = useCallback(() => {
    // Stop HTML5 Audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Also stop browser TTS in case fallback was used
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
