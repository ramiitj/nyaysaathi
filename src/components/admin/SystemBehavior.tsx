import { useState } from "react";
import { Eye, RefreshCw, FileText, MessageSquare, Star, Zap, BookOpen, BarChart3, Sparkles, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const SystemBehavior = () => {
  const [temperature, setTemperature] = useState([0.4]);
  const [maxLength, setMaxLength] = useState([1024]);
  const [exampleConvos, setExampleConvos] = useState([2]);
  const [includeKB, setIncludeKB] = useState(true);
  const [useTraining, setUseTraining] = useState(true);
  const [autoAdapt, setAutoAdapt] = useState(true);
  const [languageNuances, setLanguageNuances] = useState(true);
  const [alwaysDisclaimer, setAlwaysDisclaimer] = useState(true);
  const [citeActs, setCiteActs] = useState(true);

  const systemPrompt = `You are Nyay Saathi, a trusted legal information assistant for Indian citizens. Your role is to provide accurate, helpful legal information in a compassionate and accessible manner.

CRITICAL RULES:
1. Always start with a disclaimer that you provide legal information, not legal advice
2. Cite specific acts, sections, and case law when applicable
3. Use jurisdiction-specific laws based on user's location
4. Explain legal jargon in simple terms
5. If unsure (confidence below 85%), recommend consulting a lawyer
6. Never practice law or provide specific legal advice
7. Be culturally sensitive and use appropriate language nuances

RESPONSE FORMAT:
- Keep responses concise but comprehensive
- Use bullet points for clarity
- Always mention relevant legal acts and sections
- End with next steps or recommendations`;

  const referencedDocs = [
    { name: "Indian_Penal_Code.pdf", refs: 847 },
    { name: "CrPC_Guide.pdf", refs: 523 },
    { name: "Consumer_Protection_Act.pdf", refs: 312 },
  ];

  return (
    <div className="space-y-6">
      {/* Training Data Sources */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Training Data Sources</CardTitle>
              <CardDescription>Data used to enhance AI responses</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                View Effective Prompt
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xl font-bold">4/4</p>
                <p className="text-xs text-muted-foreground">Knowledge Base documents processed</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Training Conversations marked</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
              <Star className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-xl font-bold">47 ⭐</p>
                <p className="text-xs text-muted-foreground">32 good · 15 poor</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RAG Usage Statistics */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            RAG Usage Statistics
          </CardTitle>
          <CardDescription>How knowledge base context is being used in conversations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-border rounded-lg">
              <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">78%</p>
              <p className="text-xs text-muted-foreground">RAG Usage Rate</p>
              <div className="w-full h-2 bg-muted rounded-full mt-2">
                <div className="w-[78%] h-2 bg-primary rounded-full" />
              </div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <FileText className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">156/200</p>
              <p className="text-xs text-muted-foreground">RAG-Enhanced messages</p>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <BookOpen className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">3.2</p>
              <p className="text-xs text-muted-foreground">Avg Chunks Retrieved</p>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">High</p>
              <p className="text-xs text-muted-foreground">KB Impact</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Most Referenced Documents:</h4>
            <div className="space-y-2">
              {referencedDocs.map((doc, idx) => (
                <div key={doc.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">#{idx + 1}</span>
                    {doc.name}
                  </span>
                  <Badge variant="secondary">{doc.refs} refs</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Insights */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Training Insights</CardTitle>
              <CardDescription>AI-extracted knowledge from your training data</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analyze Training Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="insights">
              <AccordionTrigger>
                Knowledge Base Insights
                <Badge variant="secondary" className="ml-2">47 topics · 23 rules</Badge>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  The AI has learned about criminal law procedures, family dispute resolution, 
                  consumer protection guidelines, property law fundamentals, and labor rights 
                  from the uploaded documents.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Auto-Generated Prompt Enhancement */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Auto-Generated Prompt Enhancement</CardTitle>
              <CardDescription>Use AI to analyze your training data and generate an optimized system prompt</CardDescription>
            </div>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Enhanced Prompt
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Include Knowledge Base (RAG)</Label>
              <p className="text-xs text-muted-foreground">Inject document context into responses</p>
            </div>
            <Switch checked={includeKB} onCheckedChange={setIncludeKB} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Use Training Patterns</Label>
              <p className="text-xs text-muted-foreground">Learn from marked training conversations</p>
            </div>
            <Switch checked={useTraining} onCheckedChange={setUseTraining} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Example Conversations to Include</Label>
              <span className="text-sm font-medium">{exampleConvos[0]}</span>
            </div>
            <Slider value={exampleConvos} onValueChange={setExampleConvos} min={0} max={5} step={1} />
            <p className="text-xs text-muted-foreground mt-1">How many excellent-rated conversations to include as examples</p>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>Define how Nyay Saathi behaves and responds</CardDescription>
            </div>
            <Badge variant="outline">✏️ Manually edited</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea 
            defaultValue={systemPrompt}
            className="min-h-[300px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Temperature</Label>
              <span className="text-sm font-medium">{temperature[0]}</span>
            </div>
            <Slider value={temperature} onValueChange={setTemperature} min={0} max={1} step={0.1} />
            <p className="text-xs text-muted-foreground mt-1">Lower = more focused, Higher = more creative</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Max Response Length</Label>
              <span className="text-sm font-medium">{maxLength[0]} tokens</span>
            </div>
            <Slider value={maxLength} onValueChange={setMaxLength} min={256} max={4096} step={128} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Response Tone</Label>
              <Select defaultValue="empathetic">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empathetic">Empathetic & Supportive</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Follow-up Question Frequency</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium - Balanced</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavior Settings */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Behavior Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Adapt to User</Label>
              <p className="text-xs text-muted-foreground">Automatically adjust complexity based on user's understanding</p>
            </div>
            <Switch checked={autoAdapt} onCheckedChange={setAutoAdapt} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Language Nuances</Label>
              <p className="text-xs text-muted-foreground">Use culturally appropriate expressions and idioms</p>
            </div>
            <Switch checked={languageNuances} onCheckedChange={setLanguageNuances} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Always Include Disclaimer</Label>
              <p className="text-xs text-muted-foreground">Start responses with legal disclaimer</p>
            </div>
            <Switch checked={alwaysDisclaimer} onCheckedChange={setAlwaysDisclaimer} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Cite Specific Acts</Label>
              <p className="text-xs text-muted-foreground">Reference specific sections and acts</p>
            </div>
            <Switch checked={citeActs} onCheckedChange={setCiteActs} />
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SystemBehavior;
