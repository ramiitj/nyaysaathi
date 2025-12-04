import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'uploading' | 'processing' | 'processed' | 'failed';
  analysis?: FileAnalysis;
  error?: string;
}

export interface FileAnalysis {
  documentType: string;
  summary: string;
  keyPoints: string[];
  parties: string[];
  dates: string[];
  relevantLaws: string[];
  legalImplications: string;
  suggestedActions: string[];
  confidence: number;
}

interface UseFileUploadOptions {
  visitorId?: string;
  conversationId?: string | null;
  language?: string;
  maxStorage?: number;
  maxFileSize?: number;
}

const DEFAULT_MAX_STORAGE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'text/csv',
  'application/json',
  'image/jpeg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.csv', '.json', '.jpg', '.jpeg', '.png'];

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    visitorId,
    conversationId,
    language = 'EN',
    maxStorage = DEFAULT_MAX_STORAGE,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
  } = options;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const storageUsed = uploadedFiles.reduce((acc, f) => acc + f.fileSize, 0);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
        return `${file.name} is not a supported file type`;
      }
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `${file.name} exceeds 5MB limit`;
    }

    // Check total storage
    if (storageUsed + file.size > maxStorage) {
      return 'Total storage limit (5MB) exceeded';
    }

    return null;
  }, [storageUsed, maxStorage, maxFileSize]);

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: 'Upload Error',
        description: validationError,
        variant: 'destructive',
      });
      return null;
    }

    const fileId = crypto.randomUUID();
    const filePath = `${visitorId || 'anonymous'}/${fileId}/${file.name}`;

    // Add to state as uploading
    const uploadingFile: UploadedFile = {
      id: fileId,
      file,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      status: 'uploading',
    };

    setUploadedFiles(prev => [...prev, uploadingFile]);
    setIsUploading(true);

    try {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user_files')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create database record
      const { data: fileRecord, error: dbError } = await supabase
        .from('user_files')
        .insert({
          id: fileId,
          visitor_id: visitorId || null,
          conversation_id: conversationId || null,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Failed to create file record:', dbError);
      }

      // Update status to processing
      setUploadedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'processing' as const } : f)
      );

      // Call process-user-file edge function
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'process-user-file',
        { body: { fileId, language } }
      );

      if (processError) {
        throw new Error(`Processing failed: ${processError.message}`);
      }

      // Update with analysis result
      const processedFile: UploadedFile = {
        ...uploadingFile,
        status: 'processed',
        analysis: processResult?.analysis,
      };

      setUploadedFiles(prev =>
        prev.map(f => f.id === fileId ? processedFile : f)
      );

      toast({
        title: 'File Processed',
        description: `${file.name} analyzed successfully`,
      });

      return processedFile;

    } catch (error) {
      console.error('File upload error:', error);

      setUploadedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'failed' as const, error: error.message } : f)
      );

      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });

      return null;

    } finally {
      setIsUploading(false);
    }
  }, [visitorId, conversationId, language, validateFile, toast]);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];

    for (const file of files) {
      const result = await uploadFile(file);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }, [uploadFile]);

  const removeFile = useCallback(async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      // Delete from storage
      const filePath = `${visitorId || 'anonymous'}/${fileId}/${file.fileName}`;
      await supabase.storage.from('user_files').remove([filePath]);

      // Delete from database
      await supabase.from('user_files').delete().eq('id', fileId);

      // Remove from state
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));

      toast({
        title: 'File Removed',
        description: `${file.fileName} deleted`,
      });

    } catch (error) {
      console.error('Failed to remove file:', error);
    }
  }, [uploadedFiles, visitorId, toast]);

  const clearAllFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  const getFileContext = useCallback((): string => {
    const processedFiles = uploadedFiles.filter(f => f.status === 'processed' && f.analysis);
    
    if (processedFiles.length === 0) return '';

    return processedFiles.map(f => {
      const a = f.analysis!;
      return `
[UPLOADED DOCUMENT: ${f.fileName}]
Type: ${a.documentType}
Summary: ${a.summary}
Key Points: ${a.keyPoints.join(', ')}
Relevant Laws: ${a.relevantLaws.join(', ')}
Legal Implications: ${a.legalImplications}
`;
    }).join('\n');
  }, [uploadedFiles]);

  return {
    uploadedFiles,
    storageUsed,
    maxStorage,
    isUploading,
    uploadFile,
    uploadFiles,
    removeFile,
    clearAllFiles,
    getFileContext,
    allowedTypes: ALLOWED_TYPES,
    allowedExtensions: ALLOWED_EXTENSIONS,
  };
};
