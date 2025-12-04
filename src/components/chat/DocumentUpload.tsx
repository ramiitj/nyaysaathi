import React, { useCallback } from 'react';
import { Upload, File, X, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  uploadedFiles: File[];
  storageUsed: number;
  onFilesUploaded: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}

const MAX_STORAGE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  uploadedFiles,
  storageUsed,
  onFilesUploaded,
  onRemoveFile,
}) => {
  const { config } = useLanguage();
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported file type`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 5MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    const totalSize = validFiles.reduce((acc, f) => acc + f.size, 0) + storageUsed;
    if (totalSize > MAX_STORAGE) {
      toast({
        title: 'Storage limit exceeded',
        description: 'Total storage cannot exceed 10MB',
        variant: 'destructive',
      });
      return;
    }

    if (validFiles.length > 0) {
      onFilesUploaded(validFiles);
      toast({
        title: 'Files uploaded',
        description: `${validFiles.length} file(s) uploaded successfully`,
      });
    }
  };

  const storagePercentage = (storageUsed / MAX_STORAGE) * 100;

  return (
    <div className="space-y-4">
      <h3 className={`text-sm font-medium text-foreground ${config.fontClass}`}>
        {config.ui.uploadDocument}
      </h3>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
      >
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, JPG, PNG, TXT (max 5MB each)
          </p>
        </label>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
            >
              <File className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => onRemoveFile(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Storage Indicator */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            Storage
          </span>
          <span>
            {formatFileSize(storageUsed)} / {formatFileSize(MAX_STORAGE)}
          </span>
        </div>
        <Progress value={storagePercentage} className="h-1" />
      </div>
    </div>
  );
};

export default DocumentUpload;