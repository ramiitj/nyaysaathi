import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { LanguageContext } from "@/context/LanguageContext";
import { ConsentContext } from "@/context/ConsentContext";
import { languages } from "@/config/languages";
import { CheckCircle, Flag } from "lucide-react";

const languageIcons: { [key: string]: string } = {
  en: "us",
  hi: "in",
  es: "es",
  fr: "fr",
  de: "de",
  unknown: "unknown",
};

const Landing = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { setLanguage } = useContext(LanguageContext);
  const { consent, setConsent } = useContext(ConsentContext);

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang);
  };

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsent(e.target.checked);
  };

  const handleSubmit = () => {
    if (!consent) {
      toast({
        title: "Consent Required",
        description: "Please provide your consent to continue.",
      });
      return;
    }

    router.push("/chat");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="Nyay Saathi Logo" className="h-12" />
        </div>
        <h1 className="text-2xl font-semibold text-center text-foreground mb-4">
          Welcome to Nyay Saathi
        </h1>
        <div className="mb-4">
          <h2 className="text-lg font-medium text-foreground mb-2">
            Select your language:
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(languages).map(([lang, langConfig]) => {
              const flagCode = languageIcons[lang] || "unknown";
              return (
                <button
                  key={lang}
                  className="flex flex-col items-center justify-center px-4 py-2 rounded-md bg-muted hover:bg-accent text-foreground"
                  onClick={() => handleLanguageSelect(lang)}
                >
                  <Flag size={32}/>
                   {/* <span>{langConfig.nativeName}</span> */}
                  <audio id={`audio-${lang}`} src={`/audio/${lang}.mp3`} preload="auto"></audio>
                 </button>
              );
            })}
          </div>
        </div>
        <div className="mb-4">
          <label className="flex items-center space-x-2 text-foreground">
            <input
              type="checkbox"
              className="h-5 w-5 rounded text-primary focus:ring-0 focus:ring-offset-0"
              checked={consent}
              onChange={handleConsentChange}
            />
            <span>I consent to the terms and conditions</span>
          </label>
        </div>
        <button
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/80"
          onClick={handleSubmit}
        >
          Let's Chat
        </button>
      </div>
    </div>
  );
};

export default Landing;
