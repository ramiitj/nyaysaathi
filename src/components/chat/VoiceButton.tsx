import React from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceState } from '@/pages/Chat';

interface VoiceButtonProps {
  state: VoiceState;
  onClick: () => void;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ state, onClick }) => {
  const getButtonClasses = () => {
    const base = 'voice-button w-40 h-40 md:w-48 md:h-48';
    
    switch (state) {
      case 'recording':
        return cn(base, 'voice-button-recording');
      case 'processing':
        return cn(base, 'voice-button-processing');
      case 'responding':
        return cn(base, 'voice-button-responding');
      default:
        return cn(base, 'voice-button-idle hover:scale-105 active:scale-95');
    }
  };

  const renderIcon = () => {
    const iconClass = 'w-16 h-16 md:w-20 md:h-20';
    
    switch (state) {
      case 'recording':
        return <Waveform />;
      case 'processing':
        return <Loader2 className={cn(iconClass, 'animate-spin')} />;
      case 'responding':
        return <Volume2 className={iconClass} />;
      default:
        return <Mic className={iconClass} />;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={state === 'processing' || state === 'responding'}
      className={getButtonClasses()}
      aria-label={`Voice input - ${state}`}
    >
      {renderIcon()}
    </button>
  );
};

// Waveform animation component
const Waveform: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-1 h-16 md:h-20">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="waveform-bar w-2 md:w-3 rounded-full"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
};

export default VoiceButton;