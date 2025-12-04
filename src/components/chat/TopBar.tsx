import React from 'react';
import { Info, AlertTriangle, Scale, Lock, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import LanguageSelector from '@/components/landing/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

interface TopBarProps {
  onInfoClick: () => void;
  onEmergencyClick: () => void;
  onResourcesClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  onInfoClick,
  onEmergencyClick,
  onResourcesClick,
}) => {
  const { config } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Scale className="w-6 h-6 text-primary" />
        <span className="font-semibold text-foreground hidden sm:inline">Nyay Saathi</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onInfoClick}
          className="gap-1.5"
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">{config.ui.info}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onEmergencyClick}
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden sm:inline">{config.ui.emergency}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onResourcesClick}
          className="gap-1.5"
        >
          <Scale className="w-4 h-4" />
          <span className="hidden sm:inline">{config.ui.resources}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {/* Admin login */}}
          className="gap-1.5"
        >
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">{config.ui.admin}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        <div className="hidden md:block">
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
};

export default TopBar;