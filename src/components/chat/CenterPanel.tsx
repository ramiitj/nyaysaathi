import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Send } from 'lucide-react';
import VoiceButton from './VoiceButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import type { VoiceState, Message, InputMode } from '@/pages/Chat';

interface CenterPanelProps {
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  inputMode: InputMode;
  transcription: string;
  setTranscription: (text: string) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
}

const CenterPanel: React.FC<CenterPanelProps> = ({
  voiceState,
  setVoiceState,
  inputMode,
  transcription,
  setTranscription,
  messages,
  onSendMessage,
}) => {
  const { config } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleVoiceClick = () => {
    if (voiceState === 'idle') {
      setVoiceState('recording');
      setTranscription('');
    } else if (voiceState === 'recording') {
      setVoiceState('processing');
      setTimeout(() => {
        const mockTranscription = 'What are my rights if my landlord refuses to return my security deposit?';
        setTranscription(mockTranscription);
        onSendMessage(mockTranscription);
      }, 1000);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
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
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                  <Volume2 className="w-3 h-3" />
                  Listen
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
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs ${
                    message.role === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                  {message.role === 'assistant' && (
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                      <Volume2 className="w-3 h-3" />
                      Listen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Transcription Card */}
          {transcription && voiceState !== 'idle' && (
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
            {voiceState === 'idle' && 'Tap to speak'}
            {voiceState === 'recording' && 'Listening...'}
            {voiceState === 'processing' && 'Processing...'}
            {voiceState === 'responding' && 'Speaking...'}
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
              placeholder="Type your message..."
              className={`flex-1 rounded-full bg-card ${config.fontClass}`}
            />
            <Button type="submit" size="icon" className="rounded-full" disabled={!inputValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CenterPanel;
