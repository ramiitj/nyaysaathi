import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Scale, ArrowLeft, Globe, Lightbulb, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useLanguage();

  const features = [
    {
      icon: Globe,
      title: config.ui.about.feature1Title,
      description: config.ui.about.feature1Desc,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Lightbulb,
      title: config.ui.about.feature2Title,
      description: config.ui.about.feature2Desc,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: Heart,
      title: config.ui.about.feature3Title,
      description: config.ui.about.feature3Desc,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className={`h-screen flex flex-col bg-gradient-warm overflow-hidden ${config.fontClass}`}>
      <Helmet>
        <title>About Nyay Saathi — Mission & Creator</title>
        <meta name="description" content="Learn about Nyay Saathi, a free voice-first legal aid platform for India, and its creator VR Ganuthula." />
        <link rel="canonical" href="https://nyaysaathi.info/about" />
        <meta property="og:title" content="About Nyay Saathi" />
        <meta property="og:description" content="Mission and creator behind India's free voice-first legal aid platform." />
        <meta property="og:url" content="https://nyaysaathi.info/about" />
      </Helmet>
      {/* Header - fixed */}
      <header className="h-12 bg-card/80 backdrop-blur-sm px-4 flex items-center border-b border-border/50 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          {config.ui.about.back}
        </Button>
        <span className="flex-1 text-center font-semibold text-sm">{config.ui.about.title}</span>
        <div className="w-20" />
      </header>

      {/* Content - scrollable */}
      <ScrollArea className="flex-1">
        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary mx-auto flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {config.ui.about.missionTitle}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {config.ui.about.missionDescription}
            </p>
          </div>

          {/* Creator Card */}
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                VR
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground text-sm">{config.ui.about.createdBy}</h2>
                <p className="text-xs text-muted-foreground truncate">{config.ui.about.creatorDescription}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 text-xs flex-shrink-0"
                onClick={() => window.open('https://www.linkedin.com/in/ganuthula/', '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
                {config.ui.about.profile}
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-4 shadow-sm border border-border/50"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {config.ui.about.footer}
            </p>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
};

export default About;
