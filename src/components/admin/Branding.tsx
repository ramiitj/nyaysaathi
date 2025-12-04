import { useState } from "react";
import { Palette, RotateCcw, Save, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Branding = () => {
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [secondaryColor, setSecondaryColor] = useState("#10B981");
  const [accentColor, setAccentColor] = useState("#F59E0B");

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
                <div 
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                />
                <Input 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Secondary Color</Label>
              <div className="flex gap-2">
                <div 
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                  style={{ backgroundColor: secondaryColor }}
                />
                <Input 
                  value={secondaryColor} 
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Accent Color</Label>
              <div className="flex gap-2">
                <div 
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                />
                <Input 
                  value={accentColor} 
                  onChange={(e) => setAccentColor(e.target.value)}
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
                style={{ backgroundColor: primaryColor }}
              >
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: primaryColor }}>Nyay Saathi</h3>
                <p className="text-sm text-muted-foreground">Legal Guidance</p>
              </div>
            </div>

            {/* Button Previews */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button style={{ backgroundColor: primaryColor }}>Primary Button</Button>
              <Button style={{ backgroundColor: secondaryColor }}>Secondary Button</Button>
              <Button style={{ backgroundColor: accentColor, color: "#000" }}>Accent Button</Button>
            </div>

            {/* Card Previews */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="rounded-lg p-4 text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <h4 className="font-medium mb-1">Primary Card</h4>
                <p className="text-sm opacity-90">Sample content in primary color</p>
              </div>
              <div 
                className="rounded-lg p-4 text-white"
                style={{ backgroundColor: secondaryColor }}
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
            <Input placeholder="https://example.com/logo.png" />
          </div>
          <div>
            <Label className="mb-2 block">Favicon URL</Label>
            <Input placeholder="https://example.com/favicon.ico" />
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

export default Branding;
