import React from 'react';
import { Scale, ExternalLink, Book, Users, Gavel, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const resources = [
  {
    name: 'Indian Kanoon',
    url: 'https://indiankanoon.org',
    description: 'Search engine for Indian law - cases, acts, and judgments',
    icon: Book,
  },
  {
    name: 'Legal Services Authority',
    url: 'https://nalsa.gov.in',
    description: 'Free legal aid for eligible citizens under NALSA',
    icon: Users,
  },
  {
    name: 'E-Courts Portal',
    url: 'https://ecourts.gov.in',
    description: 'Check case status across all courts in India',
    icon: Gavel,
  },
  {
    name: 'Tele-Law',
    url: 'https://www.tele-law.in',
    description: 'Book free legal consultation via video call',
    icon: Scale,
  },
  {
    name: 'Know Your Rights',
    url: 'https://nalsa.gov.in/know-your-rights',
    description: 'Comprehensive guide to citizen rights in India',
    icon: FileText,
  },
];

const knowledgeGuides = [
  { name: 'Fundamental Rights (Article 12-35)', topic: 'Constitution' },
  { name: 'Right to Information Act, 2005', topic: 'RTI' },
  { name: 'Consumer Protection Act, 2019', topic: 'Consumer' },
  { name: 'Domestic Violence Act, 2005', topic: 'Family' },
  { name: 'Rent Control Laws', topic: 'Property' },
];

const ResourcesModal: React.FC<ResourcesModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Legal Resources
          </DialogTitle>
          <DialogDescription>
            Official portals and helpful resources
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Official Portals */}
          <div>
            <h4 className="text-sm font-medium mb-3">Official Portals</h4>
            <div className="space-y-2">
              {resources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <a
                    key={resource.name}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors group"
                  >
                    <Icon className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {resource.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resource.description}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Know Your Rights */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium mb-3">Know Your Rights</h4>
            <div className="grid grid-cols-1 gap-2">
              {knowledgeGuides.map((guide) => (
                <div
                  key={guide.name}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <span className="text-sm text-foreground">{guide.name}</span>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                    {guide.topic}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourcesModal;