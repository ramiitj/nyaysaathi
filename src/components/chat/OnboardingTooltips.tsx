import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Mic, MessageSquare, Paperclip, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LanguageConfig } from '@/config/languages';

interface OnboardingTooltipsProps {
  onComplete: () => void;
  config: LanguageConfig;
}

const OnboardingTooltips: React.FC<OnboardingTooltipsProps> = ({ onComplete, config }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const onboarding = config.ui.onboarding;

  // Define steps with localized content
  const steps = [
    {
      id: 'voice-button',
      title: onboarding?.talkToMe || 'Talk to Me',
      description: onboarding?.talkToMeDesc || 'Just tap the mic and ask your question. Speak naturally like you would to a friend!',
      icon: <Mic className="w-6 h-6" />,
    },
    {
      id: 'text-toggle',
      title: onboarding?.switchToText || 'Switch to Text',
      description: onboarding?.switchToTextDesc || 'Prefer typing? Toggle to text mode using the switch in the bottom bar.',
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      id: 'attach-button',
      title: onboarding?.uploadDocs || 'Upload Documents',
      description: onboarding?.uploadDocsDesc || 'Upload legal documents for AI analysis. We support PDF, DOCX, XLSX, CSV, and images.',
      icon: <Paperclip className="w-6 h-6" />,
    },
    {
      id: 'listen-button',
      title: onboarding?.listenResponses || 'Listen to Responses',
      description: onboarding?.listenResponsesDesc || 'Click the speaker icon on any response to hear it in your language.',
      icon: <Volume2 className="w-6 h-6" />,
    },
  ];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Format step counter
  const stepText = (onboarding?.stepOf || 'Step {current} of {total}')
    .replace('{current}', String(currentStep + 1))
    .replace('{total}', String(steps.length));

  return (
    <div className={cn(
      "fixed inset-0 z-50 transition-opacity duration-300",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Center modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cn(
          "bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in border border-border relative",
          config.fontClass
        )}>
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          {/* Icon + Title row */}
          <div className="flex items-center gap-3 mb-4 pr-8">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
              {step.icon}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {step.title}
            </h3>
          </div>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {step.description}
          </p>
          
          {/* Bottom row: Skip, Progress, Next */}
          <div className="flex items-center justify-between">
            {/* Skip button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleSkip}
            >
              {onboarding?.skip || 'Skip'}
            </Button>
            
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentStep 
                      ? "bg-primary w-4" 
                      : index < currentStep 
                        ? "bg-primary/60" 
                        : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            
            {/* Next/Get Started button */}
            <Button
              size="sm"
              className="gap-1"
              onClick={handleNext}
            >
              {isLastStep ? (
                onboarding?.getStarted || 'Get Started'
              ) : (
                <>
                  {onboarding?.next || 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
          
          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {stepText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTooltips;