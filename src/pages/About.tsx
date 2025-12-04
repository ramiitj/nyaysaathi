import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ArrowLeft, Globe, Lightbulb, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const About: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Globe,
      title: 'Inclusive Technology',
      description: 'Breaking language barriers with support for 12+ Indian languages, making legal information accessible to every citizen regardless of their mother tongue.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Lightbulb,
      title: 'Empowerment',
      description: 'Turning confusing legal jargon into simple, actionable advice that anyone can understand and act upon.',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: Heart,
      title: 'Served with Empathy',
      description: 'An AI companion that listens first, understands your situation, and provides guidance with care and compassion.',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="h-14 bg-card/80 backdrop-blur-sm px-4 flex items-center border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <span className="flex-1 text-center font-semibold">About Nyay Saathi</span>
        <div className="w-20" /> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 rounded-full bg-primary mx-auto flex items-center justify-center mb-6">
            <Scale className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Democratizing Legal Knowledge for Bharat
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Nyay Saathi is more than just an app—it's a mission. Built to give every Indian instant, accessible, and accurate legal guidance in their own language.
          </p>
        </div>

        {/* Creator Card */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-lg">
              VK
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Prof. Venkat</h3>
              <p className="text-sm text-muted-foreground">IIT Jodhpur</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-3 h-3" />
              Profile
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border/50"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for Bharat by Prof. Venkat, IIT Jodhpur
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
