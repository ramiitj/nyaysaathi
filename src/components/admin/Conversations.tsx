import { useState, useEffect } from "react";
import { Download, ChevronDown, ChevronRight, Check, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  session_id: string;
  language: string;
  created_at: string | null;
  status: string | null;
  use_for_training: boolean;
  visitor_id: string | null;
  message_count: number | null;
  messages: Message[];
  visitor_info?: {
    device_info?: { os?: string; browser?: string };
    visit_count?: number;
  };
}

const Conversations = () => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [languageFilter, setLanguageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trainingFilter, setTrainingFilter] = useState("all");
  const [visitorFilter, setVisitorFilter] = useState("all");
  const [visitors, setVisitors] = useState<{ id: string; fingerprint: string }[]>([]);

  useEffect(() => {
    fetchConversations();
    fetchVisitors();
  }, [languageFilter, statusFilter, trainingFilter, visitorFilter]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('conversations')
        .select(`
          id,
          session_id,
          language,
          created_at,
          status,
          use_for_training,
          visitor_id,
          message_count
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (languageFilter !== 'all') {
        query = query.eq('language', languageFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'open' | 'resolved');
      }
      if (trainingFilter !== 'all') {
        query = query.eq('use_for_training', trainingFilter === 'enabled');
      }
      if (visitorFilter !== 'all') {
        query = query.eq('visitor_id', visitorFilter);
      }

      const { data: convData, error } = await query;

      if (error) throw error;

      // Fetch messages for each conversation
      const conversationsWithMessages = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: messagesData } = await supabase
            .from('messages')
            .select('role, content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          // Fetch visitor info if available
          let visitorInfo = undefined;
          if (conv.visitor_id) {
            const { data: visitorData } = await supabase
              .from('user_visitors')
              .select('device_info, visit_count')
              .eq('id', conv.visitor_id)
              .single();
            
            if (visitorData) {
              visitorInfo = {
                device_info: visitorData.device_info as { os?: string; browser?: string } | undefined,
                visit_count: visitorData.visit_count || undefined,
              };
            }
          }

          return {
            ...conv,
            use_for_training: conv.use_for_training || false,
            messages: messagesData || [],
            visitor_info: visitorInfo,
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVisitors = async () => {
    try {
      const { data, error } = await supabase
        .from('user_visitors')
        .select('id, fingerprint_hash')
        .order('last_visit_at', { ascending: false })
        .limit(50);
      
      if (data && !error) {
        setVisitors(data.map(v => ({ 
          id: v.id, 
          fingerprint: v.fingerprint_hash.slice(0, 8) + '...' 
        })));
      }
    } catch (err) {
      console.error('Error fetching visitors:', err);
    }
  };

  const toggleTraining = async (conv: Conversation) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ use_for_training: !conv.use_for_training })
        .eq('id', conv.id);

      if (error) throw error;

      setConversations(prev => 
        prev.map(c => 
          c.id === conv.id 
            ? { ...c, use_for_training: !c.use_for_training }
            : c
        )
      );
      toast.success(`Training ${!conv.use_for_training ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error updating training status:', err);
      toast.error('Failed to update training status');
    }
  };

  const resolveConversation = async (conv: Conversation) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'resolved', ended_at: new Date().toISOString() })
        .eq('id', conv.id);

      if (error) throw error;

      setConversations(prev => 
        prev.map(c => 
          c.id === conv.id 
            ? { ...c, status: 'resolved' }
            : c
        )
      );
      toast.success('Conversation marked as resolved');
    } catch (err) {
      console.error('Error resolving conversation:', err);
      toast.error('Failed to resolve conversation');
    }
  };

  const exportConversations = () => {
    const trainingConvos = conversations.filter(c => c.use_for_training);
    
    if (trainingConvos.length === 0) {
      toast.error('No conversations marked for training');
      return;
    }

    const exportData = trainingConvos.map(conv => ({
      id: conv.id,
      language: conv.language,
      started: conv.created_at,
      status: conv.status,
      visitor_id: conv.visitor_id || 'N/A',
      messages: conv.messages.map(m => `${m.role}: ${m.content}`).join('\n')
    }));

    const csv = [
      ['ID', 'Language', 'Started', 'Status', 'Visitor ID', 'Messages'].join(','),
      ...exportData.map(row => [
        row.id,
        row.language,
        row.started,
        row.status,
        row.visitor_id,
        `"${row.messages.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training_conversations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${trainingConvos.length} conversations`);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const languages = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur'];
  const languageNames: Record<string, string> = {
    en: 'English', hi: 'Hindi', bn: 'Bengali', ta: 'Tamil',
    te: 'Telugu', mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada',
    ml: 'Malayalam', pa: 'Punjabi', or: 'Odia', ur: 'Urdu'
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[150px] bg-white">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {languages.map(lang => (
                <SelectItem key={lang} value={lang}>{languageNames[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] bg-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={visitorFilter} onValueChange={setVisitorFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by Visitor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visitors</SelectItem>
              {visitors.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="font-mono text-xs">{v.fingerprint}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={trainingFilter} onValueChange={setTrainingFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="All Training" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Training</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="gap-2" onClick={exportConversations}>
          <Download className="h-4 w-4" />
          Export for Training
        </Button>
      </div>

      {/* Conversations Table */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Conversations ({conversations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No conversations found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Session</TableHead>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Training</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conv) => (
                  <>
                    <TableRow key={conv.id} className="cursor-pointer" onClick={() => setExpandedRow(expandedRow === conv.id ? null : conv.id)}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          {expandedRow === conv.id ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          {conv.session_id.slice(0, 12)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        {conv.visitor_id ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-xs">
                              {conv.visitor_id.slice(0, 8)}...
                            </span>
                            {conv.visitor_info?.visit_count && conv.visitor_info.visit_count > 1 && (
                              <Badge variant="secondary" className="text-[10px] px-1">
                                {conv.visitor_info.visit_count}x
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Anonymous</span>
                        )}
                      </TableCell>
                      <TableCell>{languageNames[conv.language] || conv.language}</TableCell>
                      <TableCell>{formatDate(conv.created_at)}</TableCell>
                      <TableCell>{conv.message_count || conv.messages.length}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={conv.status === "resolved" ? "default" : "secondary"}
                          className={conv.status === "resolved" ? "bg-green-500" : "bg-amber-500"}
                        >
                          {conv.status || 'open'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={conv.use_for_training} 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTraining(conv);
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        {conv.status !== 'resolved' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveConversation(conv);
                            }}
                          >
                            <Check className="h-3 w-3" />
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRow === conv.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          {/* Visitor Info */}
                          {conv.visitor_id && conv.visitor_info && (
                            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Visitor Info</p>
                              <div className="flex flex-wrap gap-4 text-xs">
                                <span>
                                  <strong>ID:</strong> {conv.visitor_id.slice(0, 16)}...
                                </span>
                                {conv.visitor_info.device_info?.os && (
                                  <span>
                                    <strong>OS:</strong> {conv.visitor_info.device_info.os}
                                  </span>
                                )}
                                {conv.visitor_info.device_info?.browser && (
                                  <span>
                                    <strong>Browser:</strong> {conv.visitor_info.device_info.browser}
                                  </span>
                                )}
                                {conv.visitor_info.visit_count && (
                                  <span>
                                    <strong>Visits:</strong> {conv.visitor_info.visit_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Messages */}
                          {conv.messages.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                              {conv.messages.map((msg, idx) => (
                                <div 
                                  key={idx} 
                                  className={`p-3 rounded-lg max-w-[80%] ${
                                    msg.role === "user" 
                                      ? "bg-primary text-primary-foreground ml-auto" 
                                      : "bg-white border border-border"
                                  }`}
                                >
                                  <p className="text-xs font-medium mb-1 opacity-70">
                                    {msg.role === "user" ? "User" : "Nyay Saathi"}
                                  </p>
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No messages in this conversation</p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Conversations;
