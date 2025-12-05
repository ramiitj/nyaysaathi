import { useState, useEffect } from "react";
import { Eye, RefreshCw, FileText, MessageSquare, Star, Zap, BookOpen, BarChart3, Sparkles, RotateCcw, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_SYSTEM_PROMPT = `You are Nyay Saathi, a trusted legal information assistant for Indian citizens. Your role is to provide accurate, helpful legal information in a compassionate and accessible manner.

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
- Use numbered lists for clarity (not asterisks)
- Always mention relevant legal acts and sections
- End with next steps or recommendations`;

interface SystemSettings {
  system_prompt: string;
  temperature: number;
  max_length: number;
  response_tone: string;
  followup_frequency: string;
  include_kb: boolean;
  use_training: boolean;
  example_convos: number;
  auto_adapt: boolean;
  language_nuances: boolean;
  always_disclaimer: boolean;
  cite_acts: boolean;
}

const SystemBehavior = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    system_prompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.4,
    max_length: 1024,
    response_tone: 'empathetic',
    followup_frequency: 'medium',
    include_kb: true,
    use_training: true,
    example_convos: 2,
    auto_adapt: true,
    language_nuances: true,
    always_disclaimer: true,
    cite_acts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEffectivePrompt, setShowEffectivePrompt] = useState(false);
  const [stats, setStats] = useState({
    documentsProcessed: 0,
    trainingConversations: 0,
    totalTopics: 0,
    totalRules: 0,
  });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'system_prompt', 'temperature', 'max_length', 'response_tone',
          'followup_frequency', 'include_kb', 'use_training', 'example_convos',
          'auto_adapt', 'language_nuances', 'always_disclaimer', 'cite_acts'
        ]);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedSettings = { ...settings };
        data.forEach(item => {
          const key = item.key as keyof SystemSettings;
          if (key in loadedSettings) {
            (loadedSettings as any)[key] = item.value;
          }
        });
        setSettings(loadedSettings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get document stats
      const { data: docs } = await supabase
        .from('documents')
        .select('topics_extracted, rules_extracted')
        .eq('status', 'processed');

      // Get training conversation count
      const { count: trainingCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact' })
        .eq('use_for_training', true);

      if (docs) {
        const allTopics = new Set(docs.flatMap(d => (d.topics_extracted as string[]) || []));
        const totalRules = docs.reduce((sum, d) => sum + ((d.rules_extracted as string[])?.length || 0), 0);
        
        setStats({
          documentsProcessed: docs.length,
          trainingConversations: trainingCount || 0,
          totalTopics: allTopics.size,
          totalRules: totalRules,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key,
        value: value,
        description: `System behavior setting: ${key}`,
      }));

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(
            { key: setting.key, value: setting.value, description: setting.description },
            { onConflict: 'key' }
          );

        if (error) throw error;
      }

      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      system_prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: 0.4,
      max_length: 1024,
      response_tone: 'empathetic',
      followup_frequency: 'medium',
      include_kb: true,
      use_training: true,
      example_convos: 2,
      auto_adapt: true,
      language_nuances: true,
      always_disclaimer: true,
      cite_acts: true,
    });
    toast.info('Settings reset to defaults (not saved yet)');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEffectivePrompt(true)}>
                <Eye className="h-4 w-4" />
                View Effective Prompt
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={loadStats}>
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
                <p className="text-xl font-bold">{stats.documentsProcessed}</p>
                <p className="text-xs text-muted-foreground">Knowledge Base documents processed</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-xl font-bold">{stats.trainingConversations}</p>
                <p className="text-xs text-muted-foreground">Training Conversations marked</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
              <Star className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-xl font-bold">{stats.totalTopics} topics · {stats.totalRules} rules</p>
                <p className="text-xs text-muted-foreground">Extracted from documents</p>
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
            RAG Configuration
          </CardTitle>
          <CardDescription>How knowledge base context is used in conversations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Include Knowledge Base (RAG)</Label>
              <p className="text-xs text-muted-foreground">Inject document context into responses</p>
            </div>
            <Switch 
              checked={settings.include_kb} 
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, include_kb: checked }))} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Use Training Patterns</Label>
              <p className="text-xs text-muted-foreground">Learn from marked training conversations</p>
            </div>
            <Switch 
              checked={settings.use_training} 
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, use_training: checked }))} 
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Example Conversations to Include</Label>
              <span className="text-sm font-medium">{settings.example_convos}</span>
            </div>
            <Slider 
              value={[settings.example_convos]} 
              onValueChange={([val]) => setSettings(prev => ({ ...prev, example_convos: val }))} 
              min={0} 
              max={5} 
              step={1} 
            />
            <p className="text-xs text-muted-foreground mt-1">How many training conversations to include as examples</p>
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
          </div>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={settings.system_prompt}
            onChange={(e) => setSettings(prev => ({ ...prev, system_prompt: e.target.value }))}
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
              <span className="text-sm font-medium">{settings.temperature}</span>
            </div>
            <Slider 
              value={[settings.temperature]} 
              onValueChange={([val]) => setSettings(prev => ({ ...prev, temperature: val }))} 
              min={0} 
              max={1} 
              step={0.1} 
            />
            <p className="text-xs text-muted-foreground mt-1">Lower = more focused, Higher = more creative</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Max Response Length</Label>
              <span className="text-sm font-medium">{settings.max_length} tokens</span>
            </div>
            <Slider 
              value={[settings.max_length]} 
              onValueChange={([val]) => setSettings(prev => ({ ...prev, max_length: val }))} 
              min={256} 
              max={4096} 
              step={128} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Response Tone</Label>
              <Select 
                value={settings.response_tone} 
                onValueChange={(val) => setSettings(prev => ({ ...prev, response_tone: val }))}
              >
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
              <Select 
                value={settings.followup_frequency}
                onValueChange={(val) => setSettings(prev => ({ ...prev, followup_frequency: val }))}
              >
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
            <Switch 
              checked={settings.auto_adapt} 
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_adapt: checked }))} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Language Nuances</Label>
              <p className="text-xs text-muted-foreground">Use culturally appropriate expressions and idioms</p>
            </div>
            <Switch 
              checked={settings.language_nuances} 
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, language_nuances: checked }))} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Always Include Disclaimer</Label>
              <p className="text-xs text-muted-foreground">Start responses with legal disclaimer</p>
            </div>
            <Switch 
              checked={settings.always_disclaimer} 
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, always_disclaimer: checked }))} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Cite Specific Acts</Label>
              <p className="text-xs text-muted-foreground">Reference specific sections and acts</p>
            </div>
            <Switch 
              checked={settings.cite_acts} 
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, cite_acts: checked }))} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="gap-2" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button className="gap-2" onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Effective Prompt Dialog */}
      <Dialog open={showEffectivePrompt} onOpenChange={setShowEffectivePrompt}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Effective System Prompt</DialogTitle>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
            {settings.system_prompt}
            {settings.always_disclaimer && '\n\n[Disclaimer will be auto-prepended to responses]'}
            {settings.cite_acts && '\n\n[Citations to specific acts/sections will be included]'}
            {settings.include_kb && '\n\n[RAG context from knowledge base will be injected]'}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemBehavior;
