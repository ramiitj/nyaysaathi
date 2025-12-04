import React from 'react';
import VoiceButton from './VoiceButton';
import { useLanguage } from '@/contexts/LanguageContext';
import type { VoiceState, Message } from '@/pages/Chat';

interface CenterPanelProps {
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  transcription: string;
  setTranscription: (text: string) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
}

const CenterPanel: React.FC<CenterPanelProps> = ({
  voiceState,
  setVoiceState,
  transcription,
  setTranscription,
  messages,
  onSendMessage,
}) => {
  const { config } = useLanguage();

  const getStatusText = () => {
    switch (voiceState) {
      case 'recording':
        return config.ui.listening;
      case 'processing':
        return config.ui.analyzing;
      case 'responding':
        return config.ui.speaking;
      default:
        return config.ui.tapToSpeak;
    }
  };

  const handleVoiceClick = () => {
    if (voiceState === 'idle') {
      setVoiceState('recording');
      // Start recording - will be implemented with actual recording logic
      setTranscription('');
    } else if (voiceState === 'recording') {
      setVoiceState('processing');
      // Stop recording and process
      // Simulate transcription
      setTimeout(() => {
        const mockTranscription = 'What are my rights if my landlord refuses to return my security deposit?';
        setTranscription(mockTranscription);
        onSendMessage(mockTranscription);
      }, 1000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Voice Button */}
      <div className="mb-8">
        <VoiceButton
          state={voiceState}
          onClick={handleVoiceClick}
        />
      </div>

      {/* Status Text */}
      <p className={`text-lg font-medium text-muted-foreground mb-4 ${config.fontClass}`}>
        {getStatusText()}
      </p>

      {/* Live Transcription */}
      {transcription && (
        <div className="max-w-md w-full p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
          <p className="text-sm text-muted-foreground mb-1">You said:</p>
          <p className={`text-foreground ${config.fontClass}`}>{transcription}</p>
        </div>
      )}

      {/* Last Response Preview (on mobile) */}
      {messages.length > 0 && (
        <div className="mt-6 max-w-md w-full md:hidden">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Last response:</p>
            <p className={`text-sm text-foreground line-clamp-3 ${config.fontClass}`}>
              {messages[messages.length - 1].content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CenterPanel;