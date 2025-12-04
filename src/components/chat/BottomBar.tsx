import React from 'react';
import { Mic, MessageSquare, Paperclip, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { InputMode } from '@/pages/Chat';

interface BottomBarProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  isConnected: boolean;
}

const BottomBar: React.FC<BottomBarProps> = ({
  inputMode,
  setInputMode,
  isConnected,
}) => {
  return (
    <footer className="h-14 bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between border-t border-border/50">
      {/* Attach Button */}
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
        <Paperclip className="w-4 h-4" />
        <span className="hidden sm:inline">Attach</span>
      </Button>

      {/* Voice/Text Toggle */}
      <div className="flex items-center bg-muted rounded-full p-1">
        <button
          onClick={() => setInputMode('voice')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            inputMode === 'voice'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Mic className="w-4 h-4" />
          Voice
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            inputMode === 'text'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Text
        </button>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-1.5 text-sm">
        {isConnected ? (
          <>
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-success hidden sm:inline">Connected</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-destructive" />
            <span className="text-destructive hidden sm:inline">Offline</span>
          </>
        )}
      </div>
    </footer>
  );
};

export default BottomBar;
