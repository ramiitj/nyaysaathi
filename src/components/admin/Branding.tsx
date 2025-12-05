import { useState, useEffect } from "react";
import { Palette, RotateCcw, Save, Scale, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandingSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  favicon_url: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  primary_color: "#2563EB",
  secondary_color: "#10B981",
  accent_color: "#F59E0B",
  logo_url: "",
  favicon_url: "",
};

const Branding = () => {
  const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['primary_color', 'secondary_color', 'accent_color', 'logo_url', 'favicon_url']);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedSettings = { ...DEFAULT_BRANDING };
        data.forEach(item => {
          const key = item.key as keyof BrandingSettings;
          if (key in loadedSettings) {
            loadedSettings[key] = item.value as string;
          }
        });
        setSettings(loadedSettings);
      }
    } catch (err) {
      console.error('Error loading branding settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key,
        value: value,
        description: `Branding setting: ${key}`,
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

      toast.success('Branding settings saved successfully');
    } catch (err) {
      console.error('Error saving branding settings:', err);
      toast.error('Failed to save branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_BRANDING);
    toast.info('Branding reset to defaults (not saved yet)');
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
      {/* Color Palette */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Color Palette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="mb-2 block">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                />
                <Input 
                  value={settings.primary_color} 
                  onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Secondary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                />
                <Input 
                  value={settings.secondary_color} 
                  onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Accent Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.accent_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                />
                <Input 
                  value={settings.accent_color} 
                  onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-white">
            {/* Logo Preview */}
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: settings.primary_color }}
              >
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: settings.primary_color }}>Nyay Saathi</h3>
                <p className="text-sm text-muted-foreground">Legal Guidance</p>
              </div>
            </div>

            {/* Button Previews */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button style={{ backgroundColor: settings.primary_color }}>Primary Button</Button>
              <Button style={{ backgroundColor: settings.secondary_color }}>Secondary Button</Button>
              <Button style={{ backgroundColor: settings.accent_color, color: "#000" }}>Accent Button</Button>
            </div>

            {/* Card Previews */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="rounded-lg p-4 text-white"
                style={{ backgroundColor: settings.primary_color }}
              >
                <h4 className="font-medium mb-1">Primary Card</h4>
                <p className="text-sm opacity-90">Sample content in primary color</p>
              </div>
              <div 
                className="rounded-lg p-4 text-white"
                style={{ backgroundColor: settings.secondary_color }}
              >
                <h4 className="font-medium mb-1">Secondary Card</h4>
                <p className="text-sm opacity-90">Sample content in secondary color</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo & Favicon */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Logo & Favicon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Logo URL</Label>
            <Input 
              placeholder="https://example.com/logo.png"
              value={settings.logo_url}
              onChange={(e) => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-2 block">Favicon URL</Label>
            <Input 
              placeholder="https://example.com/favicon.ico"
              value={settings.favicon_url}
              onChange={(e) => setSettings(prev => ({ ...prev, favicon_url: e.target.value }))}
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
    </div>
  );
};

export default Branding;
