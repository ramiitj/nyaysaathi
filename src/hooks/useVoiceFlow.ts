import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LanguageCode } from '@/config/languages';

// Unified voice flow states
export type VoiceFlowStatus = 'idle' | 'listening' | 'processing' | 'thinking' | 'speaking';

interface UseVoiceFlowOptions {
  language: LanguageCode;
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
}

const MIN_RECORDING_DURATION = 500;
const SILENCE_THRESHOLD = 0.02;
const MIN_SPEECH_FRAMES = 3;
const MIN_DURATION_FOR_BACKEND = 800;
const SILENCE_DURATION_MS = 5000;

export const useVoiceFlow = ({
  language,
  onTranscription,
  onError,
}: UseVoiceFlowOptions) => {
  const [status, setStatus] = useState<VoiceFlowStatus>('idle');
  const [pendingText, setPendingText] = useState<string | null>(null);
  
  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechFramesRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  
  // TTS refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastInputMethodRef = useRef<'voice' | 'text'>('text');

  // Cleanup recording resources
  const cleanupRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Stop TTS
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (status === 'speaking') {
      setStatus('idle');
    }
  }, [status]);

  // Speak text via TTS
  const speak = useCallback(async (text: string) => {
    if (!text) return;

    setStatus('speaking');

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language }
      });

      if (error) throw error;
      if (!data.audioContent) throw new Error('No audio content');

      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;

      audio.onended = () => {
        setStatus('idle');
        audioRef.current = null;
      };

      audio.onerror = () => {
        setStatus('idle');
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setStatus('idle');
    }
  }, [language]);

  // Monitor audio levels
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || status !== 'listening') return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);

    let maxAmplitude = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const amplitude = Math.abs(dataArray[i] - 128) / 128;
      maxAmplitude = Math.max(maxAmplitude, amplitude);
    }

    if (maxAmplitude > SILENCE_THRESHOLD) {
      speechFramesRef.current++;
      silenceStartRef.current = null;
    } else {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = Date.now();
      } else {
        const silenceDuration = Date.now() - silenceStartRef.current;
        if (silenceDuration >= SILENCE_DURATION_MS && mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, [status]);

  // Start recording
  const startListening = useCallback(async () => {
    // Stop any speaking first (voice interruption)
    stopSpeaking();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      streamRef.current = stream;
      startTimeRef.current = Date.now();
      speechFramesRef.current = 0;
      silenceStartRef.current = null;
      setPendingText(null);

      // Audio analysis setup
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      // MediaRecorder setup
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordingDuration = Date.now() - startTimeRef.current;
        const hasSpeech = speechFramesRef.current >= MIN_SPEECH_FRAMES;

        if (recordingDuration < MIN_RECORDING_DURATION) {
          cleanupRecording();
          setStatus('idle');
          onError?.('Recording too short. Please hold longer.');
          return;
        }

        const shouldSendToBackend = recordingDuration >= MIN_DURATION_FOR_BACKEND || hasSpeech;

        if (!shouldSendToBackend) {
          cleanupRecording();
          setStatus('idle');
          onError?.('No speech detected. Please try again.');
          return;
        }

        // Move to processing state
        setStatus('processing');

        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          const arrayBuffer = await audioBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          let binaryString = '';
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64Audio = btoa(binaryString);

          const { data, error } = await supabase.functions.invoke('speech-to-text', {
            body: { audio: base64Audio, language }
          });

          if (error) throw error;

          if (data.text && data.text.trim()) {
            setPendingText(data.text);
            lastInputMethodRef.current = 'voice';
            onTranscription(data.text);
            // Status will be set to 'thinking' by parent when API call starts
          } else if (data.error) {
            setStatus('idle');
            onError?.(data.error);
          } else {
            setStatus('idle');
            onError?.('Could not understand audio. Please try again.');
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setStatus('idle');
          onError?.('Failed to transcribe audio');
        } finally {
          cleanupRecording();
        }
      };

      mediaRecorder.start();
      setStatus('listening');
      
      // Start monitoring
      monitorAudioLevel();

    } catch (err) {
      console.error('Failed to start recording:', err);
      onError?.('Microphone access denied. Please enable microphone permissions.');
      cleanupRecording();
      setStatus('idle');
    }
  }, [language, onTranscription, onError, cleanupRecording, stopSpeaking, monitorAudioLevel]);

  // Stop recording
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && status === 'listening') {
      mediaRecorderRef.current.stop();
      // Status will change in onstop handler
    }
  }, [status]);

  // Main interaction handler - always callable
  const handleVoiceAction = useCallback(() => {
    switch (status) {
      case 'idle':
        startListening();
        break;
      case 'listening':
        stopListening();
        break;
      case 'speaking':
        // Interrupt and start new recording
        startListening();
        break;
      case 'processing':
      case 'thinking':
        // Cancel and return to idle
        cleanupRecording();
        setStatus('idle');
        break;
    }
  }, [status, startListening, stopListening, cleanupRecording]);

  // Set thinking state (called by parent when AI processing starts)
  const setThinking = useCallback(() => {
    setStatus('thinking');
  }, []);

  // External method to trigger speaking
  const speakResponse = useCallback((text: string) => {
    // Only auto-speak if last input was voice
    if (lastInputMethodRef.current === 'voice') {
      speak(text);
    } else {
      setStatus('idle');
    }
  }, [speak]);

  // Mark text input mode
  const markTextInput = useCallback(() => {
    lastInputMethodRef.current = 'text';
  }, []);

  // Manual speak (for listen button)
  const manualSpeak = useCallback((text: string) => {
    speak(text);
  }, [speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [cleanupRecording]);

  return {
    status,
    setStatus,
    pendingText,
    handleVoiceAction,
    setThinking,
    speakResponse,
    stopSpeaking,
    manualSpeak,
    markTextInput,
    isInterruptible: status === 'speaking' || status === 'listening',
  };
};