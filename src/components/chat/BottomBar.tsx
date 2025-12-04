import React from 'react';
import { Globe, MapPin, Wifi, WifiOff, Clock } from 'lucide-react';
import LanguageSelector from '@/components/landing/LanguageSelector';
import { useIsMobile } from '@/hooks/use-mobile';

interface BottomBarProps {
  location: { city: string; state: string };
  isConnected: boolean;
  sessionTime: number;
}

const BottomBar: React.FC<BottomBarProps> = ({
  location,
  isConnected,
  sessionTime,
}) => {
  const isMobile = useIsMobile();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="h-10 border-t border-border bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        {isMobile && (
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <LanguageSelector />
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{location.city}, {location.state}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-success" />
              <span className="text-success">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-destructive" />
              <span className="text-destructive">Offline</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(sessionTime)}</span>
        </div>
      </div>
    </footer>
  );
};

export default BottomBar;