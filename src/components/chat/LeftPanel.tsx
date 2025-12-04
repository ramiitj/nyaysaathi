import React from 'react';
import { Scale, MapPin, FileText, Tag, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { LegalContext } from '@/pages/Chat';

interface LeftPanelProps {
  legalContext: LegalContext;
}

const quickLinks = [
  { name: 'Indian Kanoon', url: 'https://indiankanoon.org', description: 'Legal Search Engine' },
  { name: 'E-Courts', url: 'https://ecourts.gov.in', description: 'Case Status' },
  { name: 'Tele-Law', url: 'https://www.tele-law.in', description: 'Free Legal Aid' },
  { name: 'Legal Services', url: 'https://nalsa.gov.in', description: 'NALSA Portal' },
];

const LeftPanel: React.FC<LeftPanelProps> = ({ legalContext }) => {
  return (
    <div className="p-4 space-y-4">
      {/* Legal Context Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            Legal Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Domain</p>
              <p className="font-medium">{legalContext.domain}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Jurisdiction</p>
              <p className="font-medium">{legalContext.jurisdiction}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Case Type</p>
              <p className="font-medium">{legalContext.caseType}</p>
            </div>
          </div>

          {legalContext.relevantActs.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs mb-2">Relevant Acts</p>
              <div className="flex flex-wrap gap-1">
                {legalContext.relevantActs.map((act, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {act}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Quick Links */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-primary" />
          Quick Links
        </h3>
        <div className="space-y-2">
          {quickLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <p className="text-sm font-medium text-foreground">{link.name}</p>
              <p className="text-xs text-muted-foreground">{link.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;