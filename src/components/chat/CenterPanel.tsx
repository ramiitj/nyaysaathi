import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Send, Loader2, VolumeX, Square, Paperclip } from 'lucide-react';
import VoiceButton from './VoiceButton';
import DocumentUpload from './DocumentUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';
import type { VoiceState, Message, InputMode } from '@/pages/Chat';
import type { UploadedFile } from '@/hooks/useFileUpload';

interface CenterPanelProps {
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  inputMode: InputMode;
  transcription: string;
  setTranscription: (text: string) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  // File upload props
  uploadedFiles?: UploadedFile[];
  storageUsed?: number;
  maxStorage?: number;
  isUploading?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onRemoveFile?: (fileId: string) => void;
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
  uploadedFiles = [],
  storageUsed = 0,
  maxStorage = 5 * 1024 * 1024,
  isUploading = false,
  onFilesSelected,
  onRemoveFile,
}) => {
  const { config } = useLanguage();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const lastInputMethodRef = useRef<'voice' | 'text'>('text');

  // Voice recording hook
  const { isRecording, isProcessing, toggleRecording } = useVoiceRecording({
    language: config.code,
    onTranscription: (text) => {
      lastInputMethodRef.current = 'voice';
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

  // Sync voice state with recording state - clearer state transitions
  useEffect(() => {
    if (isRecording) {
      setVoiceState('recording');
    } else if (isProcessing) {
      // Transcribing state - converting speech to text
      setVoiceState('transcribing');
    } else if (isLoading) {
      // Processing state - AI is thinking
      setVoiceState('processing');
    } else if (isSpeaking) {
      setVoiceState('responding');
    } else if (voiceState !== 'idle') {
      setVoiceState('idle');
    }
  }, [isRecording, isProcessing, isSpeaking, isLoading, setVoiceState, voiceState]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-speak new assistant messages ONLY when user's last input was voice
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    // Only auto-speak if:
    // 1. It's an assistant message
    // 2. User's last input was via VOICE (not text)
    // 3. It's a new message (not already spoken)
    if (
      lastMessage.role === 'assistant' &&
      lastInputMethodRef.current === 'voice' &&
      lastMessage.id !== lastMessageIdRef.current
    ) {
      lastMessageIdRef.current = lastMessage.id;
      // Start speaking immediately (concurrent with text display)
      speak(lastMessage.content);
    }
  }, [messages, speak]);

  const handleVoiceClick = () => {
    // ALWAYS stop TTS first when user wants to speak (voice interruption)
    if (isSpeaking || ttsLoading) {
      stop();
    }
    
    if (voiceState === 'recording') {
      // Stop recording
      toggleRecording();
    } else if (voiceState === 'idle' || voiceState === 'responding') {
      // Start recording (TTS already stopped above if it was playing)
      setTranscription('');
      toggleRecording();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      lastInputMethodRef.current = 'text';
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

  // Get the last user message for "YOU SAID" card
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();

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
                {config.ui.welcomeMessage}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">Just now</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`gap-1 text-xs text-muted-foreground listen-button ${config.fontClass}`}
                  onClick={() => handleListen(config.ui.welcomeMessage)}
                >
                  {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  {isSpeaking ? config.ui.stop : config.ui.listen}
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-xs font-medium text-success uppercase tracking-wide">
                        Nyay Saathi
                      </span>
                    </div>
                    {/* Speaker icon for assistant messages */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`gap-1 text-xs text-muted-foreground h-6 px-2 listen-button ${config.fontClass}`}
                      onClick={() => handleListen(message.content)}
                      disabled={ttsLoading}
                    >
                      {isSpeaking ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          {config.ui.stop}
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          {config.ui.listen}
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <p className={`text-sm whitespace-pre-wrap ${config.fontClass}`}>
                  {message.content}
                </p>
                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className={`text-xs text-muted-foreground mb-1 ${config.fontClass}`}>{config.ui.references}:</p>
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
                  <span className={`text-sm text-muted-foreground ${config.fontClass}`}>{config.ui.thinking}</span>
                </div>
              </div>
            </div>
          )}

          {/* Transcription Card - Shows during transcribing state */}
          {voiceState === 'transcribing' && (
            <div className="bg-card rounded-2xl p-4 border border-amber-500/30 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                <span className={`text-xs font-medium text-amber-500 uppercase tracking-wide ${config.fontClass}`}>
                  {config.ui.transcribing}
                </span>
              </div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      {/* Voice Mode Input */}
      {inputMode === 'voice' && (
        <div className="flex flex-col items-center py-8 px-4">
          <VoiceButton state={voiceState} onClick={handleVoiceClick} config={config} />
          <p className={`text-sm text-muted-foreground mt-4 text-center ${config.fontClass}`}>
            {voiceState === 'idle' && config.ui.tapToSpeak}
          </p>
          
          {/* YOU SAID Card - Always Below Voice Button */}
          {(transcription || lastUserMessage) && (
            <div className="bg-card rounded-2xl p-4 border shadow-sm max-w-md mt-6 w-full animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className={`text-xs font-medium uppercase tracking-wide text-muted-foreground ${config.fontClass}`}>
                  {config.ui.youSaid}
                </span>
              </div>
              <p className={`text-foreground ${config.fontClass}`}>
                {transcription || lastUserMessage?.content}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Text Mode Input */}
      {inputMode === 'text' && (
        <form onSubmit={handleTextSubmit} className="p-4 border-t border-border/50">
          <div className="max-w-2xl mx-auto flex gap-2">
            {/* File Upload Button */}
            {onFilesSelected && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full relative"
                  >
                    <Paperclip className="w-4 h-4" />
                    {uploadedFiles.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {uploadedFiles.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle className={config.fontClass}>{config.ui.attach}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <DocumentUpload
                      uploadedFiles={uploadedFiles}
                      storageUsed={storageUsed}
                      maxStorage={maxStorage}
                      isUploading={isUploading}
                      onFilesSelected={onFilesSelected}
                      onRemoveFile={onRemoveFile || (() => {})}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
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
