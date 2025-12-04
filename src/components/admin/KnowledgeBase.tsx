import { useState } from "react";
import { BookOpen, Upload, RefreshCw, Trash2, ExternalLink, FileText, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const KnowledgeBase = () => {
  const [documents] = useState([
    { name: "Indian_Penal_Code.pdf", size: "2.4 MB", uploaded: "3 Dec 2024", status: "Processed" },
    { name: "CrPC_Guide.pdf", size: "1.8 MB", uploaded: "2 Dec 2024", status: "Processed" },
    { name: "Consumer_Protection_Act.pdf", size: "956 KB", uploaded: "1 Dec 2024", status: "Processing" },
    { name: "Family_Law_Handbook.pdf", size: "3.2 MB", uploaded: "30 Nov 2024", status: "Processed" },
  ]);

  const trainingStats = [
    { label: "Topics Learned", value: "47", color: "bg-primary text-primary-foreground" },
    { label: "Behavioral Rules", value: "23", color: "bg-green-500 text-white" },
    { label: "Do's Extracted", value: "156", color: "bg-rose-500 text-white" },
    { label: "Don'ts Extracted", value: "89", color: "bg-rose-600 text-white" },
  ];

  const topics = [
    "Criminal Law", "Family Law", "Property Disputes", "Consumer Rights", 
    "Labor Law", "Constitutional Rights", "Cyber Law", "Tax Law"
  ];

  const rules = [
    "The AI should always cite relevant acts and sections",
    "The AI should avoid providing specific legal advice without proper disclaimers",
    "The AI should recommend consulting a lawyer for serious matters",
    "The AI should use jurisdiction-specific laws based on user location",
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
            <Button variant="link" className="text-primary gap-1">
              View Full Details <ExternalLink className="h-4 w-4" />
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

          {/* Topics */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Topics AI Learned From Documents:</h4>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="bg-muted text-muted-foreground">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Sample Behavioral Rules:</h4>
            <ul className="space-y-2">
              {rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">Last analyzed: 4 Dec 2024, 08:30 pm</p>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>Upload legal documents to enhance the knowledge base (RAG)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports PDF, DOCX, TXT (Max 5MB per file)</p>
          </div>
          <Button className="w-full mt-4 gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents ({documents.length})</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.name}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {doc.name}
                    </div>
                  </TableCell>
                  <TableCell>{doc.size}</TableCell>
                  <TableCell>{doc.uploaded}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={doc.status === "Processed" ? "default" : "secondary"}
                      className={doc.status === "Processed" ? "bg-green-500" : "bg-amber-500"}
                    >
                      {doc.status === "Processed" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBase;
