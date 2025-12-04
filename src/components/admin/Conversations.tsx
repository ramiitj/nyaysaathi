import { useState, useEffect } from "react";
import { Download, ChevronDown, ChevronRight, Check, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface ConversationWithVisitor {
  id: string;
  language: string;
  started: string;
  status: string;
  training: boolean;
  visitor_id: string | null;
  visitor_info?: {
    device_info?: { os?: string; browser?: string };
    visit_count?: number;
  };
  messages: { role: string; text: string }[];
}

const Conversations = () => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationWithVisitor[]>([
    { 
      id: "7681d526-a3f2-4b8c", 
      language: "Hindi", 
      started: "4 Dec, 08:37 pm", 
      status: "Open", 
      training: true,
      visitor_id: null,
      messages: [
        { role: "user", text: "मुझे तलाक की प्रक्रिया के बारे में जानकारी चाहिए" },
        { role: "ai", text: "भारत में तलाक की प्रक्रिया आपके धर्म और विवाह के प्रकार पर निर्भर करती है..." }
      ]
    },
    { 
      id: "8892e637-b4g3-5c9d", 
      language: "English", 
      started: "4 Dec, 08:30 pm", 
      status: "Resolved", 
      training: false,
      visitor_id: null,
      messages: [
        { role: "user", text: "What are my rights as a tenant?" },
        { role: "ai", text: "As a tenant in India, you have several rights under the Rent Control Act..." }
      ]
    },
    { 
      id: "9903f748-c5h4-6d0e", 
      language: "Tamil", 
      started: "4 Dec, 08:25 pm", 
      status: "Open", 
      training: true,
      visitor_id: null,
      messages: [
        { role: "user", text: "நுகர்வோர் புகார் எவ்வாறு தாக்கல் செய்வது?" },
        { role: "ai", text: "நுகர்வோர் புகார் தாக்கல் செய்ய நீங்கள் பின்வரும் படிகளை பின்பற்றலாம்..." }
      ]
    },
    { 
      id: "0014g859-d6i5-7e1f", 
      language: "Telugu", 
      started: "4 Dec, 08:20 pm", 
      status: "Resolved", 
      training: false,
      visitor_id: null,
      messages: []
    },
  ]);
  const [visitorFilter, setVisitorFilter] = useState("all");
  const [visitors, setVisitors] = useState<{ id: string; fingerprint: string }[]>([]);

  useEffect(() => {
    fetchVisitors();
  }, []);

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

  const exportConversations = () => {
    const exportData = conversations.map(conv => ({
      id: conv.id,
      language: conv.language,
      started: conv.started,
      status: conv.status,
      training: conv.training,
      visitor_id: conv.visitor_id || 'N/A',
      messages: conv.messages.map(m => `${m.role}: ${m.text}`).join('\n')
    }));

    const csv = [
      ['ID', 'Language', 'Started', 'Status', 'Training', 'Visitor ID', 'Messages'].join(','),
      ...exportData.map(row => [
        row.id,
        row.language,
        row.started,
        row.status,
        row.training,
        row.visitor_id,
        `"${row.messages.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px] bg-white">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="tamil">Tamil</SelectItem>
              <SelectItem value="telugu">Telugu</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
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

          <Select defaultValue="all">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Session</TableHead>
                <TableHead>Visitor</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Started</TableHead>
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
                        {conv.id.slice(0, 12)}...
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
                    <TableCell>{conv.language}</TableCell>
                    <TableCell>{conv.started}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={conv.status === "Resolved" ? "default" : "secondary"}
                        className={conv.status === "Resolved" ? "bg-green-500" : "bg-amber-500"}
                      >
                        {conv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={conv.training} onClick={(e) => e.stopPropagation()} />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Check className="h-3 w-3" />
                        Resolve
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRow === conv.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30 p-4">
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
                          <div className="space-y-3">
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
                                <p className="text-sm">{msg.text}</p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Conversations;
