import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Send, Loader2, VolumeX, Square } from 'lucide-react';
import VoiceButton from './VoiceButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceFlow } from '@/hooks/useVoiceFlow';
import { useToast } from '@/hooks/use-toast';
import type { Message, InputMode } from '@/pages/Chat';

interface CenterPanelProps {
  inputMode: InputMode;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
}

const CenterPanel: React.FC<CenterPanelProps> = ({
  inputMode,
  messages,
  onSendMessage,
  isLoading = false,
}) => {
  const { config } = useLanguage();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageRef = useRef<string | null>(null);

  // Unified voice flow hook
  const {
    status,
    pendingText,
    handleVoiceAction,
    setThinking,
    speakResponse,
    stopSpeaking,
    manualSpeak,
    markTextInput,
  } = useVoiceFlow({
    language: config.code,
    onTranscription: async (text) => {
      await onSendMessage(text);
    },
    onError: (error) => {
      toast({
        title: 'Voice Error',
        description: error,
        variant: 'destructive'
      });
    }
  });

  // Sync isLoading → thinking (only when loading starts and we're not already in a voice flow state)
  useEffect(() => {
    if (isLoading && status === 'idle') {
      setThinking();
    }
  }, [isLoading, status, setThinking]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-speak new assistant messages (with duplicate prevention via message ID)
  useEffect(() => {
    if (messages.length === 0 || isLoading) return;
    
    const lastMessage = messages[messages.length - 1];
    
    if (
      lastMessage.role === 'assistant' &&
      lastMessage.id !== lastProcessedMessageRef.current
    ) {
      lastProcessedMessageRef.current = lastMessage.id;
      // speakResponse now handles duplicate prevention internally
      speakResponse(lastMessage.id, lastMessage.content);
    }
  }, [messages, isLoading, speakResponse]);

  // Handle manual listen button
  const handleListen = (text: string) => {
    if (status === 'speaking') {
      stopSpeaking();
    } else {
      manualSpeak(text);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      markTextInput();
      const message = inputValue.trim();
      setInputValue('');
      await onSendMessage(message);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get the last user message for context display
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();

  // Show pending text or last user message in voice mode
  const displayedUserText = pendingText || lastUserMessage?.content;

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
                  {status === 'speaking' ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  {status === 'speaking' ? config.ui.stop : config.ui.listen}
                </Button>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
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
                    >
                      {status === 'speaking' ? (
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

          {/* Thinking indicator - only show in chat area when AI is processing */}
          {status === 'thinking' && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs font-medium text-success uppercase tracking-wide">
                    Nyay Saathi
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className={`text-sm text-muted-foreground ${config.fontClass}`}>
                    {config.ui.thinking}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Voice Mode Input */}
      {inputMode === 'voice' && (
        <div className="flex flex-col items-center py-6 px-4">
          <VoiceButton status={status} onClick={handleVoiceAction} config={config} />
          
          {/* Tap to speak hint - only when idle */}
          {status === 'idle' && (
            <p className={`text-sm text-muted-foreground mt-3 text-center ${config.fontClass}`}>
              {config.ui.tapToSpeak}
            </p>
          )}
          
          {/* Your Message Card - shows transcribed text or pending text */}
          {displayedUserText && status !== 'listening' && (
            <div className="bg-card rounded-2xl p-4 border shadow-sm max-w-md mt-4 w-full animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className={`text-xs font-medium uppercase tracking-wide text-muted-foreground ${config.fontClass}`}>
                  {config.ui.youSaid}
                </span>
              </div>
              <p className={`text-foreground ${config.fontClass}`}>
                {displayedUserText}
              </p>
            </div>
          )}
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
              aria-label="Send message"
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