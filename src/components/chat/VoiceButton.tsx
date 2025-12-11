import React from 'react';
import { Mic, Loader2, Volume2, Square, AudioLines, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceFlowStatus } from '@/hooks/useVoiceFlow';
import type { LanguageConfig } from '@/config/languages';

interface VoiceButtonProps {
  status: VoiceFlowStatus;
  onClick: () => void;
  config: LanguageConfig;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ status, onClick, config }) => {
  const getButtonClasses = () => {
    const base = 'w-[150px] h-[150px] rounded-full flex items-center justify-center shadow-2xl voice-button-transition';
    
    switch (status) {
      case 'listening':
        return cn(base, 'bg-[#F97316] text-white scale-110 shadow-[0_0_60px_rgba(249,115,22,0.5)] cursor-pointer');
      case 'processing':
        return cn(base, 'bg-amber-500 text-white shadow-[0_0_40px_rgba(245,158,11,0.5)] cursor-pointer');
      case 'thinking':
        return cn(base, 'bg-primary text-primary-foreground shadow-[0_0_40px_rgba(37,99,235,0.4)] cursor-pointer');
      case 'speaking':
        return cn(base, 'bg-success text-success-foreground shadow-[0_0_40px_rgba(16,185,129,0.4)] cursor-pointer hover:scale-105');
      default:
        return cn(base, 'bg-primary text-primary-foreground hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] active:scale-95 cursor-pointer');
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'listening':
        return <Waveform />;
      case 'processing':
        return <AudioLines className="w-12 h-12 animate-pulse" />;
      case 'thinking':
        return <Loader2 className="w-12 h-12 animate-spin" />;
      case 'speaking':
        return <Volume2 className="w-12 h-12 animate-pulse" />;
      default:
        return <Mic className="w-12 h-12" />;
    }
  };

  const getStateLabel = () => {
    switch (status) {
      case 'listening':
        return config.ui.listening;
      case 'processing':
        return config.ui.transcribing;
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
        return 'bg-[#F97316] text-white';
      case 'processing':
        return 'bg-amber-500 text-white';
      case 'thinking':
        return 'bg-primary text-primary-foreground';
      case 'speaking':
        return 'bg-success text-success-foreground';
      default:
        return '';
    }
  };

  const getInteractionHint = () => {
    switch (status) {
      case 'listening':
        return 'Tap to stop';
      case 'speaking':
        return 'Tap to interrupt';
      case 'processing':
      case 'thinking':
        return 'Tap to cancel';
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
        aria-label={`Voice input - ${status}. ${interactionHint || 'Tap to speak'}`}
      >
        {renderIcon()}
      </button>
      
      {/* State Badge */}
      {stateLabel && (
        <div className={cn(
          'px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-fade-in voice-badge-transition',
          config.fontClass,
          getStateBadgeClasses()
        )}>
          {status === 'listening' && (
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          )}
          {status === 'processing' && (
            <Loader2 className="w-3 h-3 animate-spin" />
          )}
          {status === 'thinking' && (
            <Loader2 className="w-3 h-3 animate-spin" />
          )}
          {status === 'speaking' && (
            <Volume2 className="w-3 h-3" />
          )}
          {stateLabel}
        </div>
      )}

      {/* Interaction Hint - subtle text below badge */}
      {interactionHint && (
        <span className="text-xs text-muted-foreground/70 animate-fade-in">
          {interactionHint}
        </span>
      )}
    </div>
  );
};

// Enhanced Waveform animation component
const Waveform: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-12">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-white animate-waveform"
          style={{
            animationDelay: `${i * 0.1}s`,
            height: '100%'
          }}
        />
      ))}
    </div>
  );
};

export default VoiceButton;