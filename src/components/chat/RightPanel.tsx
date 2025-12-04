import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import DocumentUpload from './DocumentUpload';
import TextChat from './TextChat';
import type { Message } from '@/pages/Chat';
import type { UploadedFile } from '@/hooks/useFileUpload';

interface RightPanelProps {
  uploadedFiles: UploadedFile[];
  storageUsed: number;
  maxStorage: number;
  isUploading: boolean;
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (fileId: string) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  uploadedFiles,
  storageUsed,
  maxStorage,
  isUploading,
  onFilesSelected,
  onRemoveFile,
  messages,
  onSendMessage,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="h-full flex flex-col">
      {/* Document Upload Section */}
      <div className="p-4 border-b border-border">
        <DocumentUpload
          uploadedFiles={uploadedFiles}
          storageUsed={storageUsed}
          maxStorage={maxStorage}
          isUploading={isUploading}
          onFilesSelected={onFilesSelected}
          onRemoveFile={onRemoveFile}
        />
      </div>

      {/* Text Chat - Collapsible */}
      <Collapsible
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        className="flex-1 flex flex-col min-h-0"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto rounded-none border-b border-border"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="w-4 h-4" />
              Text Chat
            </span>
            {isChatOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="flex-1 min-h-0">
          <TextChat
            messages={messages}
            onSendMessage={onSendMessage}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default RightPanel;