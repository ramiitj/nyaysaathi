import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Send, Loader2, VolumeX } from 'lucide-react';
import VoiceButton from './VoiceButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';
import type { VoiceState, Message, InputMode } from '@/pages/Chat';

interface CenterPanelProps {
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  inputMode: InputMode;
  transcription: string;
  setTranscription: (text: string) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

const CenterPanel: React.FC<CenterPanelProps> = ({
  voiceState,
  setVoiceState,
  inputMode,
  transcription,
  setTranscription,
  messages,
  onSendMessage,
  isLoading = false,
}) => {
  const { config } = useLanguage();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice recording hook
  const { isRecording, isProcessing, toggleRecording } = useVoiceRecording({
    language: config.code,
    onTranscription: (text) => {
      setTranscription(text);
      onSendMessage(text);
    },
    onError: (error) => {
      toast({
        title: 'Voice Error',
        description: error,
        variant: 'destructive'
      });
      setVoiceState('idle');
    }
  });

  // Text to speech hook
  const { speak, stop, isSpeaking, isLoading: ttsLoading } = useTextToSpeech({
    language: config.code
  });

  // Sync voice state with recording state
  useEffect(() => {
    if (isRecording) {
      setVoiceState('recording');
    } else if (isProcessing || isLoading) {
      setVoiceState('processing');
    } else if (isSpeaking) {
      setVoiceState('responding');
    } else if (voiceState !== 'idle') {
      // Only set to idle if we're not in a loading state
      if (!isLoading) {
        setVoiceState('idle');
      }
    }
  }, [isRecording, isProcessing, isSpeaking, isLoading, setVoiceState, voiceState]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleVoiceClick = () => {
    if (voiceState === 'idle' || voiceState === 'recording') {
      toggleRecording();
      if (voiceState === 'idle') {
        setTranscription('');
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleListen = (text: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto py-6 space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-success uppercase tracking-wide">
                  Nyay Saathi
                </span>
              </div>
              <p className={`text-foreground ${config.fontClass}`}>
                Hey there! I'm Nyay Saathi, your legal buddy. What's on your mind today? I'm here to help you understand your legal rights and guide you through any legal questions you might have.
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">Just now</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-xs text-muted-foreground"
                  onClick={() => handleListen("Hey there! I'm Nyay Saathi, your legal buddy. What's on your mind today? I'm here to help you understand your legal rights and guide you through any legal questions you might have.")}
                >
                  {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  {isSpeaking ? 'Stop' : 'Listen'}
                </Button>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card shadow-sm border border-border/50'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-xs font-medium text-success uppercase tracking-wide">
                      Nyay Saathi
                    </span>
                  </div>
                )}
                <p className={`text-sm whitespace-pre-wrap ${config.fontClass}`}>
                  {message.content}
                </p>
                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">References:</p>
                    {message.citations.map((citation, idx) => (
                      <span key={idx} className="inline-block text-xs bg-muted px-2 py-0.5 rounded mr-1 mb-1">
                        {citation.text}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs ${
                    message.role === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                  {message.role === 'assistant' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 text-xs text-muted-foreground"
                      onClick={() => handleListen(message.content)}
                      disabled={ttsLoading}
                    >
                      {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      {isSpeaking ? 'Stop' : 'Listen'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Transcription Card */}
          {transcription && voiceState !== 'idle' && !isLoading && (
            <div className="bg-muted/50 rounded-2xl p-4 border border-border/50 animate-fade-in">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                You Said
              </p>
              <p className={`text-foreground ${config.fontClass}`}>{transcription}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Voice Mode Input */}
      {inputMode === 'voice' && (
        <div className="flex flex-col items-center py-8 px-4">
          <VoiceButton state={voiceState} onClick={handleVoiceClick} />
          <p className="text-sm text-muted-foreground mt-4">
            {voiceState === 'idle' && config.ui.tapToSpeak}
            {voiceState === 'recording' && config.ui.listening}
            {voiceState === 'processing' && config.ui.analyzing}
            {voiceState === 'responding' && config.ui.speaking}
          </p>
        </div>
      )}

      {/* Text Mode Input */}
      {inputMode === 'text' && (
        <form onSubmit={handleTextSubmit} className="p-4 border-t border-border/50">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={config.ui.typeMessage}
              className={`flex-1 rounded-full bg-card ${config.fontClass}`}
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full" 
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CenterPanel;
