import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LanguageCode } from '@/config/languages';

interface UseVoiceRecordingOptions {
  language: LanguageCode;
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  onAudioLevel?: (level: number) => void;
}

const MIN_RECORDING_DURATION = 500; // Minimum 500ms to prevent accidental taps
const SILENCE_THRESHOLD = 0.02; // More lenient threshold for speech detection
const MIN_SPEECH_FRAMES = 3; // Reduced frames required for valid speech
const MIN_DURATION_FOR_BACKEND = 800; // Send to backend if recording > 800ms regardless

export const useVoiceRecording = ({ 
  language, 
  onTranscription, 
  onError,
  onAudioLevel 
}: UseVoiceRecordingOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechFramesRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Monitor audio levels using time-domain analysis for better speech detection
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    // Use time-domain data for amplitude-based detection (more reliable)
    analyserRef.current.getByteTimeDomainData(dataArray);

    // Calculate max amplitude deviation from center (128 is silence)
    let maxAmplitude = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const amplitude = Math.abs(dataArray[i] - 128) / 128;
      maxAmplitude = Math.max(maxAmplitude, amplitude);
    }

    // Track speech frames when amplitude exceeds threshold
    if (maxAmplitude > SILENCE_THRESHOLD) {
      speechFramesRef.current++;
    }

    // Callback for visual feedback
    onAudioLevel?.(maxAmplitude);

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, [isRecording, onAudioLevel]);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone with audio preprocessing
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for speech recognition
          channelCount: 1    // Mono for speech
        }
      });

      streamRef.current = stream;
      startTimeRef.current = Date.now();
      speechFramesRef.current = 0;

      // Set up audio analysis for level monitoring
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      // Create MediaRecorder with optimal settings
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

        // Check minimum duration
        if (recordingDuration < MIN_RECORDING_DURATION) {
          cleanup();
          onError?.('Recording too short. Please hold longer.');
          return;
        }

        // Be lenient: if duration is reasonable (>800ms), send to backend regardless
        // Let Gemini decide if there's valid speech
        const shouldSendToBackend = recordingDuration >= MIN_DURATION_FOR_BACKEND || hasSpeech;
        
        if (!shouldSendToBackend) {
          cleanup();
          onError?.('No speech detected. Please try again.');
          return;
        }

        setIsProcessing(true);

        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          
          // Convert to base64 using chunked approach to avoid stack overflow
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
            onTranscription(data.text);
          } else if (data.error) {
            onError?.(data.error);
          } else {
            onError?.('Could not understand audio. Please try again.');
          }
        } catch (err) {
          console.error('Transcription error:', err);
          onError?.('Failed to transcribe audio');
        } finally {
          setIsProcessing(false);
          cleanup();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start audio level monitoring
      monitorAudioLevel();

    } catch (err) {
      console.error('Failed to start recording:', err);
      onError?.('Microphone access denied. Please enable microphone permissions.');
      cleanup();
    }
  }, [language, onTranscription, onError, cleanup, monitorAudioLevel]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop audio level monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording
  };
};
