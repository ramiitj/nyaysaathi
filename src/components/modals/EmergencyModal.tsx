import React from 'react';
import { AlertTriangle, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EmergencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emergencyNumbers = [
  { name: 'Police', number: '100', description: 'For immediate police assistance' },
  { name: 'Women Helpline', number: '181', description: 'National Commission for Women' },
  { name: 'Child Helpline', number: '1098', description: 'Childline Foundation' },
  { name: 'Tele-Law', number: '15100', description: 'Free legal advice' },
  { name: 'Cyber Crime', number: '1930', description: 'National Cyber Crime Helpline' },
  { name: 'Consumer Helpline', number: '1915', description: 'National Consumer Helpline' },
  { name: 'Ambulance', number: '108', description: 'Emergency medical services' },
  { name: 'Fire', number: '101', description: 'Fire brigade' },
];

const EmergencyModal: React.FC<EmergencyModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Emergency Helplines
          </DialogTitle>
          <DialogDescription>
            If you're in immediate danger, call these numbers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {emergencyNumbers.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Phone className="w-3 h-3" />
                {item.number}
              </Button>
            </a>
          ))}
        </div>

        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
          <p className="text-sm text-destructive font-medium">
            ⚠️ For life-threatening emergencies, call 112 (Universal Emergency Number)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyModal;