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
    const base = 'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg';
    
    switch (state) {
      case 'recording':
        return cn(base, 'bg-destructive text-destructive-foreground animate-pulse-recording');
      case 'processing':
        return cn(base, 'bg-warning text-warning-foreground');
      case 'responding':
        return cn(base, 'bg-success text-success-foreground animate-pulse-responding');
      default:
        return cn(base, 'bg-primary text-primary-foreground hover:scale-110 active:scale-95');
    }
  };

  const renderIcon = () => {
    const iconClass = 'w-8 h-8';
    
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
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="waveform-bar w-1 rounded-full bg-current"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
};

export default VoiceButton;
