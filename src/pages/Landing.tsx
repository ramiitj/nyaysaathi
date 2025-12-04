import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, AlertTriangle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import LanguageSelector from '@/components/landing/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConsent } from '@/contexts/ConsentContext';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useLanguage();
  const { consent, setConsent, allConsented } = useConsent();

  const handleStartConsultation = () => {
    if (allConsented) {
      navigate('/chat');
    }
  };

  const consentItems = [
    {
      key: 'informational' as const,
      label: 'I understand this is informational only, not legal advice',
      labelHi: 'मैं समझता/समझती हूँ कि यह केवल जानकारी है, कानूनी सलाह नहीं',
    },
    {
      key: 'location' as const,
      label: 'I allow location access for jurisdiction-specific guidance',
      labelHi: 'मैं क्षेत्राधिकार-विशिष्ट मार्गदर्शन के लिए स्थान पहुँच की अनुमति देता/देती हूँ',
    },
    {
      key: 'recording' as const,
      label: 'I consent to anonymized recording for improvement',
      labelHi: 'मैं सुधार के लिए गुमनाम रिकॉर्डिंग की सहमति देता/देती हूँ',
    },
    {
      key: 'privacy' as const,
      label: 'I have read the privacy policy and terms of service',
      labelHi: 'मैंने गोपनीयता नीति और सेवा की शर्तें पढ़ ली हैं',
    },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-primary/5 ${config.fontClass}`}>
      {/* Emergency Banner */}
      <div className="bg-destructive/10 border-b border-destructive/20 py-2 px-4">
        <div className="container mx-auto flex items-center justify-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">🚨 IN DANGER? CALL</span>
          <a href="tel:100" className="font-bold underline flex items-center gap-1">
            <Phone className="w-4 h-4" />
            100 (POLICE)
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Language Selector - Top Right */}
        <div className="flex justify-end mb-8">
          <LanguageSelector />
        </div>

        {/* Hero Section */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <Scale className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            <span className="text-primary">Legal First Aid</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-hindi mb-2">
            भारत का कानूनी सहायक
          </p>
          <p className="text-muted-foreground">
            Voice-first AI legal assistant in 12 Indian languages
          </p>
        </div>

        {/* Consent Card */}
        <div className="max-w-xl mx-auto">
          <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-6 text-center">
              Before we begin, please confirm:
            </h2>
            
            <div className="space-y-4 mb-8">
              {consentItems.map((item) => (
                <div key={item.key} className="flex items-start gap-3">
                  <Checkbox
                    id={item.key}
                    checked={consent[item.key]}
                    onCheckedChange={(checked) => setConsent(item.key, checked as boolean)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={item.key}
                    className="text-sm text-foreground/80 cursor-pointer leading-relaxed"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>

            <Button
              onClick={handleStartConsultation}
              disabled={!allConsented}
              className="w-full h-12 text-lg font-medium transition-all duration-300"
              size="lg"
            >
              {config.ui.startConsultation}
            </Button>

            {/* Disclaimer */}
            <p className={`text-xs text-center text-muted-foreground mt-4 ${config.fontClass}`}>
              {config.disclaimer}
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 mt-12 text-sm text-muted-foreground">
          <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="/about" className="hover:text-primary transition-colors">About Us</a>
        </div>
      </div>
    </div>
  );
};

export default Landing;