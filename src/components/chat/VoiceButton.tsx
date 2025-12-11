import React from 'react';
import { Mic, Loader2, Volume2, Square, AudioLines } from 'lucide-react';
import type { VoiceFlowStatus } from '@/hooks/useVoiceFlow';
import type { LanguageConfig } from '@/config/languages';

interface VoiceButtonProps {
  status: VoiceFlowStatus;
  onClick: () => void;
  config: LanguageConfig;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ status, onClick, config }) => {
  const getButtonClasses = () => {
    const baseClasses = 'voice-button-transition w-[150px] h-[150px] rounded-full flex items-center justify-center shadow-lg cursor-pointer';
    
    switch (status) {
      case 'listening':
        return `${baseClasses} bg-orange-500 hover:bg-orange-600 animate-pulse shadow-orange-500/50`;
      case 'processing':
        return `${baseClasses} bg-amber-500 hover:bg-amber-600 shadow-amber-500/30`;
      case 'thinking':
        return `${baseClasses} bg-primary hover:bg-primary/90 shadow-primary/30`;
      case 'speaking':
        return `${baseClasses} bg-success hover:bg-success/90 shadow-success/30 animate-pulse`;
      default:
        return `${baseClasses} bg-primary hover:bg-primary/90 shadow-primary/30`;
    }
  };

  const renderIcon = () => {
    const iconClasses = 'w-16 h-16 text-white';
    
    switch (status) {
      case 'listening':
        return <Waveform />;
      case 'processing':
        return <AudioLines className={`${iconClasses} animate-pulse`} />;
      case 'thinking':
        return <Loader2 className={`${iconClasses} animate-spin`} />;
      case 'speaking':
        return <Volume2 className={iconClasses} />;
      default:
        return <Mic className={iconClasses} />;
    }
  };

  const getStateLabel = () => {
    switch (status) {
      case 'listening':
        return config.ui.listening;
      case 'processing':
        return config.ui.processing;
      case 'thinking':
        return config.ui.thinking;
      case 'speaking':
        return config.ui.speaking;
      default:
        return null;
    }
  };

  const getStateBadgeClasses = () => {
    switch (status) {
      case 'listening':
        return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'processing':
        return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'thinking':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'speaking':
        return 'bg-success/20 text-success border-success/30';
      default:
        return '';
    }
  };

  // Localized interaction hints
  const getInteractionHint = () => {
    switch (status) {
      case 'listening':
        return config.ui.tapToStop || 'Tap to stop';
      case 'speaking':
        return config.ui.tapToInterrupt || 'Tap to interrupt';
      case 'processing':
      case 'thinking':
        return config.ui.tapToCancel || 'Tap to cancel';
      default:
        return null;
    }
  };

  const stateLabel = getStateLabel();
  const interactionHint = getInteractionHint();

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        className={getButtonClasses()}
        aria-label={status === 'idle' ? config.ui.tapToSpeak : stateLabel || ''}
      >
        {renderIcon()}
      </button>
      
      {/* State badge */}
      {stateLabel && (
        <div className={`voice-badge-transition px-4 py-1.5 rounded-full text-sm font-medium border ${getStateBadgeClasses()} ${config.fontClass}`}>
          {status === 'listening' && (
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse mr-2" />
          )}
          {status === 'processing' && (
            <Loader2 className="inline-block w-3 h-3 animate-spin mr-2" />
          )}
          {status === 'thinking' && (
            <Loader2 className="inline-block w-3 h-3 animate-spin mr-2" />
          )}
          {status === 'speaking' && (
            <Volume2 className="inline-block w-3 h-3 mr-2" />
          )}
          {stateLabel}
        </div>
      )}
      
      {/* Interaction hint */}
      {interactionHint && (
        <p className={`text-xs text-muted-foreground animate-fade-in ${config.fontClass}`}>
          {interactionHint}
        </p>
      )}
    </div>
  );
};

// Animated waveform for listening state
const Waveform = () => (
  <div className="flex items-center justify-center gap-1 h-16">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="w-2 bg-white rounded-full animate-pulse"
        style={{
          height: `${20 + Math.random() * 30}px`,
          animationDelay: `${i * 0.1}s`,
          animationDuration: '0.6s',
        }}
      />
    ))}
  </div>
);

export default VoiceButton;