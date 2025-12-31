import { useState, useEffect, useRef } from "react";
import { BookOpen, Upload, RefreshCw, Trash2, FileText, CheckCircle, Clock, AlertCircle, Loader2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  file_size: number | null;
  created_at: string | null;
  status: string | null;
  chunk_count: number | null;
  topics_extracted: string[] | null;
  rules_extracted: string[] | null;
}

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();

    // Set up real-time subscription for document updates
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          console.log('Document change:', payload);
          fetchDocuments(); // Refresh data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data?.map(doc => ({
        ...doc,
        topics_extracted: doc.topics_extracted as string[] | null,
        rules_extracted: doc.rules_extracted as string[] | null,
      })) || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const maxFiles = 10;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

    // Limit to 5 files
    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed at once`);
      return;
    }

    // Validate all files first
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (too large)`);
      } else if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (unsupported type)`);
      } else {
        validFiles.push(file);
      }
    }

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: validFiles.length });

    const uploadResults: { success: boolean; docId?: string; fileName: string }[] = [];

    // Upload all files in parallel
    const uploadPromises = validFiles.map(async (file, index) => {
      try {
        // Upload to storage
        const filePath = `${Date.now()}_${index}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            status: 'pending',
          })
          .select()
          .single();

        if (docError) throw docError;

        setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
        return { success: true, docId: docData.id, fileName: file.name };
      } catch (err) {
        console.error(`Upload error for ${file.name}:`, err);
        setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
        return { success: false, fileName: file.name };
      }
    });

    const results = await Promise.all(uploadPromises);
    uploadResults.push(...results);

    const successfulUploads = uploadResults.filter(r => r.success);
    const failedUploads = uploadResults.filter(r => !r.success);

    if (successfulUploads.length > 0) {
      toast.success(`${successfulUploads.length} document(s) uploaded successfully`);
      
      // Trigger processing for all successfully uploaded documents
      successfulUploads.forEach(upload => {
        if (upload.docId) {
          processDocument(upload.docId);
        }
      });
    }

    if (failedUploads.length > 0) {
      toast.error(`Failed to upload: ${failedUploads.map(f => f.fileName).join(', ')}`);
    }

    fetchDocuments();
    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processDocument = async (documentId: string) => {
    setProcessingIds(prev => new Set(prev).add(documentId));

    try {
      const { error } = await supabase.functions.invoke('process-document', {
        body: { documentId }
      });

      if (error) throw error;

      toast.success('Document processing started');
      
      // Poll for completion
      const checkStatus = setInterval(async () => {
        const { data } = await supabase
          .from('documents')
          .select('status')
          .eq('id', documentId)
          .single();

        if (data?.status === 'processed' || data?.status === 'failed') {
          clearInterval(checkStatus);
          setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(documentId);
            return newSet;
          });
          fetchDocuments();
          
          if (data.status === 'processed') {
            toast.success('Document processed successfully');
          } else {
            toast.error('Document processing failed');
          }
        }
      }, 3000);

      // Clear interval after 5 minutes max
      setTimeout(() => clearInterval(checkStatus), 300000);
    } catch (err) {
      console.error('Processing error:', err);
      toast.error('Failed to start document processing');
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const deleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

    try {
      // Delete from storage first
      const { data: docData } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', doc.id)
        .single();

      if (docData?.file_path) {
        await supabase.storage.from('documents').remove([docData.file_path]);
      }

      // Delete embeddings
      await supabase.from('document_embeddings').delete().eq('document_id', doc.id);

      // Delete document record
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);

      if (error) throw error;

      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate stats from real data
  const processedDocs = documents.filter(d => d.status === 'processed');
  const allTopics = [...new Set(processedDocs.flatMap(d => d.topics_extracted || []))];
  const allRules = processedDocs.flatMap(d => d.rules_extracted || []);
  const totalChunks = processedDocs.reduce((sum, d) => sum + (d.chunk_count || 0), 0);

  const trainingStats = [
    { label: "Topics Learned", value: allTopics.length.toString(), color: "bg-primary text-primary-foreground" },
    { label: "Behavioral Rules", value: allRules.length.toString(), color: "bg-green-500 text-white" },
    { label: "Documents Processed", value: processedDocs.length.toString(), color: "bg-rose-500 text-white" },
    { label: "Total Chunks", value: totalChunks.toString(), color: "bg-amber-500 text-white" },
  ];

  return (
    <div className="space-y-6">
      {/* Training Impact Section */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Training Impact
              </CardTitle>
              <CardDescription>How your documents are influencing AI behavior</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setShowDetailsDialog(true)}
              disabled={processedDocs.length === 0}
            >
              <Eye className="h-4 w-4" />
              View Full Details
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trainingStats.map((stat) => (
              <div key={stat.label} className={`${stat.color} rounded-lg p-4 text-center`}>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs opacity-90">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Topics Preview */}
          {allTopics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Topics AI Learned From Documents:</h4>
              <div className="flex flex-wrap gap-2">
                {allTopics.slice(0, 8).map((topic) => (
                  <Badge key={topic} variant="secondary" className="bg-muted text-muted-foreground">
                    {topic}
                  </Badge>
                ))}
                {allTopics.length > 8 && (
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setShowDetailsDialog(true)}>
                    +{allTopics.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Rules Preview */}
          {allRules.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Sample Behavioral Rules:</h4>
              <ul className="space-y-2">
                {allRules.slice(0, 4).map((rule, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    {rule}
                  </li>
                ))}
                {allRules.length > 4 && (
                  <li className="text-sm text-primary cursor-pointer hover:underline" onClick={() => setShowDetailsDialog(true)}>
                    View all {allRules.length} rules...
                  </li>
                )}
              </ul>
            </div>
          )}

          {documents.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No documents uploaded yet. Upload legal documents to train the AI.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>Upload legal documents to enhance the knowledge base (RAG)</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            )}
            <p className="text-sm text-muted-foreground mb-2">
              {isUploading 
                ? `Uploading ${uploadProgress.current} of ${uploadProgress.total} files...` 
                : 'Drag and drop up to 10 files here, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground">Supports PDF, DOCX, TXT (Max 5MB per file, up to 10 files at once)</p>
          </div>
          
          {/* Processing indicator */}
          {processingIds.size > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing {processingIds.size} document(s)...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents ({documents.length})</CardTitle>
            <Button variant="outline" size="sm" className="gap-2" onClick={fetchDocuments}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>{formatDate(doc.created_at)}</TableCell>
                    <TableCell>{doc.chunk_count || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={doc.status === "processed" ? "default" : "secondary"}
                        className={
                          doc.status === "processed" ? "bg-green-500" : 
                          doc.status === "processing" ? "bg-amber-500" :
                          doc.status === "failed" ? "bg-red-500" : "bg-gray-400"
                        }
                      >
                        {doc.status === "processed" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : doc.status === "processing" || processingIds.has(doc.id) ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : doc.status === "failed" ? (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {processingIds.has(doc.id) ? 'Processing' : doc.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {doc.status === 'pending' && !processingIds.has(doc.id) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => processDocument(doc.id)}
                          >
                            Process
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Full Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Full Training Details
            </DialogTitle>
            <DialogDescription>
              Complete overview of what the AI has learned from your documents
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3">
                {trainingStats.map((stat) => (
                  <div key={stat.label} className={`${stat.color} rounded-lg p-3 text-center`}>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs opacity-90">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* All Topics */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  All Topics ({allTopics.length})
                </h4>
                {allTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allTopics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="bg-muted text-muted-foreground">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No topics extracted yet</p>
                )}
              </div>

              {/* All Rules */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  All Behavioral Rules ({allRules.length})
                </h4>
                {allRules.length > 0 ? (
                  <ul className="space-y-2">
                    {allRules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary font-bold">{index + 1}.</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No behavioral rules extracted yet</p>
                )}
              </div>

              {/* Document Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Document Breakdown
                </h4>
                <div className="space-y-3">
                  {processedDocs.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm truncate max-w-[300px]">{doc.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.chunk_count || 0} chunks
                        </Badge>
                      </div>
                      {doc.topics_extracted && doc.topics_extracted.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.topics_extracted.map((topic) => (
                            <Badge key={topic} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBase;