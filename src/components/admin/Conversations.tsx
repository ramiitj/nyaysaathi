import { useState } from "react";
import { Download, ChevronDown, ChevronRight, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Conversations = () => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [conversations] = useState([
    { 
      id: "7681d526-a3f2-4b8c", 
      language: "Hindi", 
      started: "4 Dec, 08:37 pm", 
      status: "Open", 
      training: true,
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
      messages: []
    },
  ]);

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

        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
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
                <TableHead className="w-[250px]">Session</TableHead>
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
                  {expandedRow === conv.id && conv.messages.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30 p-4">
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
