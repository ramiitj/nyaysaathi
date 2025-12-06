import React from 'react';
import { Scale, RotateCcw, Info, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LanguageConfig } from '@/config/languages';

interface TopBarProps {
  onStartFresh: () => void;
  onInfoClick: () => void;
  onEmergencyClick: () => void;
  onAdminClick: () => void;
  config: LanguageConfig;
}

const TopBar: React.FC<TopBarProps> = ({
  onStartFresh,
  onInfoClick,
  onEmergencyClick,
  onAdminClick,
  config,
}) => {
  return (
    <header className="h-14 bg-card/80 backdrop-blur-sm px-2 sm:px-4 flex items-center justify-between border-b border-border/50">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Scale className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground hidden sm:inline">Nyay Saathi</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartFresh}
          className={`gap-1.5 text-muted-foreground hover:text-foreground px-2 sm:px-3 ${config.fontClass}`}
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">{config.ui.startFresh}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onInfoClick}
          className="text-muted-foreground hover:text-foreground w-8 h-8 sm:w-9 sm:h-9"
        >
          <Info className="w-4 h-4" />
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onEmergencyClick}
          className={`gap-1.5 bg-helpline hover:bg-helpline/90 text-white px-2 sm:px-3 ${config.fontClass}`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">{config.ui.helpline}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onAdminClick}
          className="text-muted-foreground hover:text-foreground w-8 h-8 sm:w-9 sm:h-9"
        >
          <Lock className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
