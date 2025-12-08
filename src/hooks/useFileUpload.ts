import { useState, useCallback, useEffect } from 'react';
import { openDB, IDBPDatabase } from 'idb';
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
  base64Data?: string;
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
const DB_NAME = 'nyay-saathi-files';
const STORE_NAME = 'files';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/json',
  'image/jpeg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.csv', '.json', '.jpg', '.jpeg', '.png'];

// Initialize IndexedDB
async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

// Convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    language = 'EN',
    maxStorage = DEFAULT_MAX_STORAGE,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
  } = options;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const storageUsed = uploadedFiles.reduce((acc, f) => acc + f.fileSize, 0);

  // Load files from IndexedDB on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const db = await getDB();
        const storedFiles = await db.getAll(STORE_NAME);
        if (storedFiles.length > 0) {
          setUploadedFiles(storedFiles.map(sf => ({
            ...sf,
            file: new File([], sf.fileName), // Placeholder - actual file data is in base64Data
          })));
        }
      } catch (error) {
        console.error('Failed to load files from IndexedDB:', error);
      }
    };
    loadFiles();
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
        return `${file.name} is not a supported file type`;
      }
    }

    if (file.size > maxFileSize) {
      return `${file.name} exceeds 5MB limit`;
    }

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
      // Convert file to base64 for local storage
      const base64Data = await fileToBase64(file);

      // Store in IndexedDB (local browser storage - NOT backend)
      const db = await getDB();
      await db.put(STORE_NAME, {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        base64Data,
        status: 'processing',
        createdAt: new Date().toISOString(),
      });

      // Update status to processing
      setUploadedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'processing' as const, base64Data } : f)
      );

      // Call process-user-file edge function with base64 data directly
      // File is NOT stored on backend - only analyzed
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'process-user-file',
        { 
          body: { 
            fileId,
            fileName: file.name,
            mimeType: file.type,
            base64Data,
            language 
          } 
        }
      );

      if (processError) {
        throw new Error(`Processing failed: ${processError.message}`);
      }

      // Update with analysis result
      const processedFile: UploadedFile = {
        ...uploadingFile,
        status: 'processed',
        analysis: processResult?.analysis,
        base64Data,
      };

      // Update IndexedDB
      await db.put(STORE_NAME, {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        base64Data,
        status: 'processed',
        analysis: processResult?.analysis,
        createdAt: new Date().toISOString(),
      });

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

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setUploadedFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'failed' as const, error: errorMessage } : f)
      );

      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;

    } finally {
      setIsUploading(false);
    }
  }, [language, validateFile, toast]);

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
      // Remove from IndexedDB only (no backend storage to delete)
      const db = await getDB();
      await db.delete(STORE_NAME, fileId);

      // Remove from state
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));

      toast({
        title: 'File Removed',
        description: `${file.fileName} deleted`,
      });

    } catch (error) {
      console.error('Failed to remove file:', error);
    }
  }, [uploadedFiles, toast]);

  const clearAllFiles = useCallback(async () => {
    try {
      const db = await getDB();
      await db.clear(STORE_NAME);
      setUploadedFiles([]);
    } catch (error) {
      console.error('Failed to clear files:', error);
    }
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
