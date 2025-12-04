import React, { useCallback } from 'react';
import { Upload, File, X, HardDrive, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UploadedFile } from '@/hooks/useFileUpload';

interface DocumentUploadProps {
  uploadedFiles: UploadedFile[];
  storageUsed: number;
  maxStorage: number;
  isUploading: boolean;
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (fileId: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  uploadedFiles,
  storageUsed,
  maxStorage,
  isUploading,
  onFilesSelected,
  onRemoveFile,
}) => {
  const { config } = useLanguage();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  }, [onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      e.target.value = ''; // Reset input
    }
  };

  const storagePercentage = (storageUsed / maxStorage) * 100;

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return config.code === 'HI' ? 'अपलोड हो रहा है...' : 
               config.code === 'TE' ? 'అప్‌లోడ్ అవుతోంది...' : 'Uploading...';
      case 'processing':
        return config.ui.processing;
      case 'processed':
        return config.code === 'HI' ? 'तैयार' : 
               config.code === 'TE' ? 'సిద్ధం' : 'Ready';
      case 'failed':
        return config.code === 'HI' ? 'विफल' : 
               config.code === 'TE' ? 'విఫలమైంది' : 'Failed';
    }
  };

  // Localized strings
  const fileAttachmentLabel = {
    HI: 'फ़ाइल जोड़ें',
    EN: 'File Attachment',
    BN: 'ফাইল সংযুক্তি',
    TA: 'கோப்பு இணைப்பு',
    TE: 'ఫైల్ జోడింపు',
    MR: 'फाइल जोडा',
    GU: 'ફાઇલ જોડાણ',
    KN: 'ಫೈಲ್ ಲಗತ್ತು',
    ML: 'ഫയൽ അറ്റാച്ച്മെന്റ്',
    PA: 'ਫਾਈਲ ਅਟੈਚਮੈਂਟ',
    OR: 'ଫାଇଲ୍ ସଂଲଗ୍ନ',
    UR: 'فائل منسلک کریں',
  }[config.code] || 'File Attachment';

  const clickOrDragLabel = {
    HI: 'क्लिक करें या खींचें',
    EN: 'Click or drag to upload',
    BN: 'ক্লিক করুন বা টানুন',
    TA: 'கிளிக் செய்யவும் அல்லது இழுக்கவும்',
    TE: 'క్లిక్ చేయండి లేదా డ్రాగ్ చేయండి',
    MR: 'क्लिक करा किंवा ड्रॅग करा',
    GU: 'ક્લિક કરો અથવા ખેંચો',
    KN: 'ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಎಳೆಯಿರಿ',
    ML: 'ക്ലിക്ക് ചെയ്യുക അല്ലെങ്കിൽ വലിച്ചിടുക',
    PA: 'ਕਲਿੱਕ ਕਰੋ ਜਾਂ ਖਿੱਚੋ',
    OR: 'କ୍ଲିକ୍ କରନ୍ତୁ କିମ୍ବା ଟାଣନ୍ତୁ',
    UR: 'کلک کریں یا گھسیٹیں',
  }[config.code] || 'Click or drag to upload';

  const storageLabel = {
    HI: 'स्टोरेज',
    EN: 'Storage',
    BN: 'স্টোরেজ',
    TA: 'சேமிப்பு',
    TE: 'స్టోరేజ్',
    MR: 'स्टोरेज',
    GU: 'સ્ટોરેજ',
    KN: 'ಸಂಗ್ರಹಣೆ',
    ML: 'സ്റ്റോറേജ്',
    PA: 'ਸਟੋਰੇਜ',
    OR: 'ଷ୍ଟୋରେଜ୍',
    UR: 'اسٹوریج',
  }[config.code] || 'Storage';

  return (
    <div className="space-y-4" dir={config.direction}>
      <h3 className={`text-sm font-medium text-foreground ${config.fontClass}`}>
        {fileAttachmentLabel}
      </h3>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.csv,.json,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          {isUploading ? (
            <Loader2 className="w-8 h-8 mx-auto text-primary mb-2 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          )}
          <p className={`text-sm text-muted-foreground ${config.fontClass}`}>
            {clickOrDragLabel}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, XLSX, CSV, JSON, PNG, JPG
          </p>
        </label>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
            >
              {getStatusIcon(file.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.fileSize)} • {getStatusText(file.status)}
                </p>
                {file.analysis && (
                  <p className="text-xs text-primary truncate">
                    {file.analysis.documentType}: {file.analysis.summary.substring(0, 50)}...
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => onRemoveFile(file.id)}
                disabled={file.status === 'uploading' || file.status === 'processing'}
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
          <span className={`flex items-center gap-1 ${config.fontClass}`}>
            <HardDrive className="w-3 h-3" />
            {storageLabel}
          </span>
          <span>
            {formatFileSize(storageUsed)} / {formatFileSize(maxStorage)}
          </span>
        </div>
        <Progress value={storagePercentage} className="h-1" />
      </div>
    </div>
  );
};

export default DocumentUpload;