import React from 'react';
import { Mic, Loader2, Volume2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceState } from '@/pages/Chat';

interface VoiceButtonProps {
  state: VoiceState;
  onClick: () => void;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ state, onClick }) => {
  const getButtonClasses = () => {
    const base = 'w-[150px] h-[150px] rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl';
    
    switch (state) {
      case 'recording':
        return cn(base, 'bg-[#F97316] text-white scale-110 shadow-[0_0_60px_rgba(249,115,22,0.5)]');
      case 'processing':
        return cn(base, 'bg-warning text-warning-foreground shadow-[0_0_40px_rgba(245,158,11,0.4)]');
      case 'responding':
        return cn(base, 'bg-success text-success-foreground shadow-[0_0_40px_rgba(16,185,129,0.4)]');
      default:
        return cn(base, 'bg-primary text-primary-foreground hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] active:scale-95');
    }
  };

  const renderIcon = () => {
    switch (state) {
      case 'recording':
        return <Waveform />;
      case 'processing':
        return <Loader2 className="w-12 h-12 animate-spin" />;
      case 'responding':
        return <Volume2 className="w-12 h-12" />;
      default:
        return <Mic className="w-12 h-12" />;
    }
  };

  const getStateLabel = () => {
    switch (state) {
      case 'recording':
        return 'Listening';
      case 'processing':
        return 'Processing';
      case 'responding':
        return 'Speaking';
      default:
        return null;
    }
  };

  const stateLabel = getStateLabel();

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onClick}
        disabled={state === 'processing'}
        className={getButtonClasses()}
        aria-label={`Voice input - ${state}`}
      >
        {renderIcon()}
      </button>
      
      {/* State Badge */}
      {stateLabel && (
        <div className={cn(
          "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-fade-in",
          state === 'recording' && "bg-[#F97316] text-white",
          state === 'processing' && "bg-warning text-warning-foreground",
          state === 'responding' && "bg-success text-success-foreground"
        )}>
          {state === 'recording' && (
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          )}
          {stateLabel}...
        </div>
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
