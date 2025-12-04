import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Mic, MessageSquare, Paperclip, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'voice-button',
    title: 'Tap to Speak',
    description: 'Press the microphone to ask your legal questions using voice. Speak in any of our 12 supported Indian languages.',
    icon: <Mic className="w-5 h-5" />,
    targetSelector: '[aria-label*="Voice input"]',
    position: 'top',
  },
  {
    id: 'text-toggle',
    title: 'Switch to Text',
    description: 'Prefer typing? Toggle to text mode using the switch in the bottom bar.',
    icon: <MessageSquare className="w-5 h-5" />,
    targetSelector: '[aria-label*="Toggle"]',
    position: 'top',
  },
  {
    id: 'attach-button',
    title: 'Upload Documents',
    description: 'Upload legal documents, contracts, or images for AI analysis. We support PDFs, images, and more.',
    icon: <Paperclip className="w-5 h-5" />,
    targetSelector: '[aria-label*="Attach"]',
    position: 'top',
  },
  {
    id: 'listen-button',
    title: 'Listen to Responses',
    description: 'Click "Listen" on any response to hear it spoken in your selected language.',
    icon: <Volume2 className="w-5 h-5" />,
    targetSelector: '.listen-button',
    position: 'left',
  },
];

interface OnboardingTooltipsProps {
  onComplete: () => void;
}

const OnboardingTooltips: React.FC<OnboardingTooltipsProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Add backdrop blur effect
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
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

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className={cn(
      "fixed inset-0 z-50 transition-opacity duration-300",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Center modal for onboarding */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in border border-border">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Skip onboarding"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "bg-primary w-6" 
                    : index < currentStep 
                      ? "bg-primary/50" 
                      : "bg-muted"
                )}
              />
            ))}
          </div>
          
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {step.icon}
            </div>
          </div>
          
          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {step.title}
            </h3>
            <p className="text-muted-foreground text-sm">
              {step.description}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
            >
              Skip
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleNext}
            >
              {currentStep < ONBOARDING_STEPS.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </div>
          
          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTooltips;
