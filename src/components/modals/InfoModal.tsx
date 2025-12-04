import React from 'react';
import { Scale, User, Calendar, Mail, Github } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            About Nyay Saathi
          </DialogTitle>
          <DialogDescription>
            Legal First Aid for India
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Created by</p>
              <p className="text-sm text-muted-foreground">Prof. Venkat, IIT Jodhpur</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Version</p>
              <p className="text-sm text-muted-foreground">1.0.0 (December 2024)</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium mb-2">Mission</h4>
            <p className="text-sm text-muted-foreground">
              To democratize access to legal knowledge for all Indian citizens through 
              intelligent, multilingual AI assistance. We provide trusted legal information 
              in 12 major Indian languages.
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium mb-2">Important Notice</h4>
            <p className="text-sm text-muted-foreground">
              This service provides general legal information only. It is not a substitute 
              for professional legal advice. For specific legal matters, please consult 
              a qualified lawyer.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <a
              href="mailto:feedback@nyaysaathi.info"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Mail className="w-4 h-4" />
              Feedback
            </a>
            <a
              href="https://github.com/nyaysaathi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;