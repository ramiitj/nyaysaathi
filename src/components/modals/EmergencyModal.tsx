import React from 'react';
import { AlertTriangle, Phone, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EmergencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const helplines = [
  { name: 'Police Emergency', number: '100', icon: '🚔' },
  { name: 'Women Helpline', number: '181', icon: '👩' },
  { name: 'Child Helpline', number: '1098', icon: '👶' },
  { name: 'Tele-Law', number: '15100', icon: '⚖️' },
  { name: 'Cyber Crime', number: '1930', icon: '💻' },
  { name: 'Consumer Helpline', number: '1915', icon: '🛒' },
];

const EmergencyModal: React.FC<EmergencyModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="bg-helpline px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5" />
              Helpline
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Helpline List */}
        <div className="p-4 space-y-2">
          {helplines.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-foreground">{item.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Phone className="w-3 h-3" />
                {item.number}
              </Button>
            </a>
          ))}
        </div>

        {/* Emergency Footer */}
        <div className="bg-destructive/10 border-t border-destructive/20 px-4 py-3">
          <p className="text-sm text-center text-destructive font-medium">
            ⚠️ For life-threatening emergencies, call <strong>112</strong>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyModal;
