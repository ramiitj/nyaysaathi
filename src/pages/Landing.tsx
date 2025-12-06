import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConsent } from '@/contexts/ConsentContext';
import { LANGUAGES, LanguageCode } from '@/config/languages';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, config } = useLanguage();
  const { hasConsented, setConsent } = useConsent();
  const [step, setStep] = useState<'language' | 'consent'>('language');

  const handleLanguageSelect = (langCode: LanguageCode) => {
    setLanguage(langCode);
    setStep('consent');
  };

  const handleStartChat = () => {
    if (hasConsented) {
      navigate('/chat');
    }
  };

  const consentPoints = [
    config.ui.consent.shareLocation,
    config.ui.consent.allowLogging,
    config.ui.consent.helpImprove,
    config.ui.consent.acceptTerms,
  ];

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Selection Step */}
        {step === 'language' && (
          <div className="bg-card rounded-3xl shadow-xl p-8 animate-fade-in">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
                <Scale className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Welcome to Nyay Saathi</h1>
              <p className="text-muted-foreground text-center mt-2">
                Instant legal first-aid in your language
              </p>
            </div>

            {/* Language Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => {
                const config = LANGUAGES[code];
                return (
                  <button
                    key={code}
                    onClick={() => handleLanguageSelect(code)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      language === code
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className={`text-lg font-medium ${config.fontClass}`}>
                      {config.nativeName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground">
              Your trusted legal first-aid companion
            </p>
          </div>
        )}

        {/* Consent Step */}
        {step === 'consent' && (
          <div className="bg-card rounded-3xl shadow-xl p-8 animate-fade-in">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
                <Scale className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Welcome to Nyay Saathi</h1>
              <p className="text-muted-foreground text-center mt-2">
                Your trusted friend for all legal matters
              </p>
            </div>

            {/* Consent Section */}
            <div className="mb-6">
              <p className={`text-sm font-medium text-foreground mb-3 ${config.fontClass}`}>
                {config.ui.consent.byUsing}
              </p>
              
              {/* Consent points as bullet list */}
              <div className="bg-muted/50 rounded-xl p-4 mb-4">
                <ul className="space-y-2">
                  {consentPoints.map((point, index) => (
                    <li key={index} className={`flex items-start gap-2 text-sm text-muted-foreground ${config.fontClass}`}>
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Single consent checkbox */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent-all"
                  checked={hasConsented}
                  onCheckedChange={(checked) => setConsent(checked as boolean)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="consent-all"
                  className={`text-sm font-medium text-foreground cursor-pointer leading-relaxed ${config.fontClass}`}
                >
                  {config.ui.consent.agreeToAll}
                </Label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('language')}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleStartChat}
                disabled={!hasConsented}
                className="flex-1"
              >
                Let's Chat
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Talk to us about your legal questions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
