import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LanguageCode } from '@/config/languages';

interface UseTextToSpeechOptions {
  language: LanguageCode;
}

export const useTextToSpeech = ({ language }: UseTextToSpeechOptions) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

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
        toast({
          title: 'Audio Error',
          description: 'Failed to play audio. Please try again.',
          variant: 'destructive'
        });
      };

      await audio.play();

    } catch (err) {
      console.error('TTS error:', err);
      setIsLoading(false);
      setIsSpeaking(false);
      toast({
        title: 'Speech Error',
        description: 'Unable to generate speech. Please try again later.',
        variant: 'destructive'
      });
    }
  }, [language, toast]);

  const stop = useCallback(() => {
    // Stop HTML5 Audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
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
