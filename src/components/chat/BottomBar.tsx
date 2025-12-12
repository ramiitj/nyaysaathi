import React, { useState } from 'react';
import { Mic, MessageSquare, Paperclip, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import DocumentUpload from '@/components/chat/DocumentUpload';
import type { InputMode } from '@/pages/Chat';
import type { LanguageConfig } from '@/config/languages';
import type { UploadedFile } from '@/hooks/useFileUpload';

interface BottomBarProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  isConnected: boolean;
  config: LanguageConfig;
  uploadedFiles?: UploadedFile[];
  storageUsed?: number;
  maxStorage?: number;
  isUploading?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onRemoveFile?: (fileId: string) => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
  inputMode,
  setInputMode,
  isConnected,
  config,
  uploadedFiles = [],
  storageUsed = 0,
  maxStorage = 10 * 1024 * 1024,
  isUploading = false,
  onFilesSelected,
  onRemoveFile,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <footer className="h-14 bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between border-t border-border/50">
      {/* Attach Button with Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground relative">
            <Paperclip className="w-4 h-4" />
            <span className={`hidden sm:inline ${config.fontClass}`}>{config.ui.attach}</span>
            {uploadedFiles.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {uploadedFiles.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle className={config.fontClass}>{config.ui.attach}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <DocumentUpload
              uploadedFiles={uploadedFiles}
              storageUsed={storageUsed}
              maxStorage={maxStorage}
              isUploading={isUploading}
              onFilesSelected={onFilesSelected || (() => {})}
              onRemoveFile={onRemoveFile || (() => {})}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Voice/Text Toggle */}
      <div className="flex items-center bg-muted rounded-full p-1">
        <button
          onClick={() => setInputMode('voice')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            config.fontClass,
            inputMode === 'voice'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Mic className="w-4 h-4" />
          {config.ui.voice}
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            config.fontClass,
            inputMode === 'text'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          {config.ui.text}
        </button>
      </div>

      {/* Connection Status */}
      <div className={cn("flex items-center gap-1.5 text-sm", config.fontClass)}>
        {isConnected ? (
          <>
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-success hidden sm:inline">{config.ui.connected}</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-destructive" />
            <span className="text-destructive hidden sm:inline">{config.ui.offline}</span>
          </>
        )}
      </div>
    </footer>
  );
};

export default BottomBar;
