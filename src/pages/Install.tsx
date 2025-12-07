import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share, MoreVertical } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const translations: Record<string, { title: string; description: string; installed: string; installButton: string; iosInstructions: string; androidInstructions: string; continueToApp: string }> = {
    en: {
      title: "Install Nyay Saathi",
      description: "Install our app for quick access to legal assistance anytime, anywhere.",
      installed: "App Already Installed!",
      installButton: "Install App",
      iosInstructions: "Tap the Share button, then 'Add to Home Screen'",
      androidInstructions: "Tap the menu (⋮) button, then 'Install app' or 'Add to Home Screen'",
      continueToApp: "Continue to App",
    },
    hi: {
      title: "न्याय साथी इंस्टॉल करें",
      description: "कहीं भी, कभी भी कानूनी सहायता के लिए हमारा ऐप इंस्टॉल करें।",
      installed: "ऐप पहले से इंस्टॉल है!",
      installButton: "ऐप इंस्टॉल करें",
      iosInstructions: "शेयर बटन पर टैप करें, फिर 'होम स्क्रीन पर जोड़ें'",
      androidInstructions: "मेनू (⋮) बटन पर टैप करें, फिर 'ऐप इंस्टॉल करें' या 'होम स्क्रीन पर जोड़ें'",
      continueToApp: "ऐप पर जारी रखें",
    },
    bn: {
      title: "ন্যায় সাথী ইনস্টল করুন",
      description: "যেকোনো সময়, যেকোনো জায়গায় আইনি সহায়তার জন্য আমাদের অ্যাপ ইনস্টল করুন।",
      installed: "অ্যাপ ইতিমধ্যে ইনস্টল করা আছে!",
      installButton: "অ্যাপ ইনস্টল করুন",
      iosInstructions: "শেয়ার বোতামে ট্যাপ করুন, তারপর 'হোম স্ক্রিনে যোগ করুন'",
      androidInstructions: "মেনু (⋮) বোতামে ট্যাপ করুন, তারপর 'অ্যাপ ইনস্টল করুন' বা 'হোম স্ক্রিনে যোগ করুন'",
      continueToApp: "অ্যাপে চালিয়ে যান",
    },
    ta: {
      title: "நியாய சாதி நிறுவுங்கள்",
      description: "எந்த நேரத்திலும், எங்கிருந்தும் சட்ட உதவிக்கு எங்கள் செயலியை நிறுவுங்கள்.",
      installed: "செயலி ஏற்கனவே நிறுவப்பட்டுள்ளது!",
      installButton: "செயலியை நிறுவு",
      iosInstructions: "பகிர் பொத்தானை அழுத்தி, 'முகப்புத் திரையில் சேர்'",
      androidInstructions: "மெனு (⋮) பொத்தானை அழுத்தி, 'செயலியை நிறுவு' அல்லது 'முகப்புத் திரையில் சேர்'",
      continueToApp: "செயலிக்குச் செல்",
    },
    te: {
      title: "న్యాయ సాథి ఇన్‌స్టాల్ చేయండి",
      description: "ఎప్పుడైనా, ఎక్కడైనా చట్టపరమైన సహాయం కోసం మా యాప్‌ను ఇన్‌స్టాల్ చేయండి.",
      installed: "యాప్ ఇప్పటికే ఇన్‌స్టాల్ చేయబడింది!",
      installButton: "యాప్ ఇన్‌స్టాల్ చేయండి",
      iosInstructions: "షేర్ బటన్ నొక్కండి, తర్వాత 'హోమ్ స్క్రీన్‌కు జోడించు'",
      androidInstructions: "మెను (⋮) బటన్ నొక్కండి, తర్వాత 'యాప్ ఇన్‌స్టాల్ చేయండి' లేదా 'హోమ్ స్క్రీన్‌కు జోడించు'",
      continueToApp: "యాప్‌కు కొనసాగించు",
    },
    mr: {
      title: "न्याय साथी इंस्टॉल करा",
      description: "कधीही, कुठेही कायदेशीर मदतीसाठी आमचे अॅप इंस्टॉल करा.",
      installed: "अॅप आधीच इंस्टॉल केले आहे!",
      installButton: "अॅप इंस्टॉल करा",
      iosInstructions: "शेअर बटणावर टॅप करा, नंतर 'होम स्क्रीनवर जोडा'",
      androidInstructions: "मेनू (⋮) बटणावर टॅप करा, नंतर 'अॅप इंस्टॉल करा' किंवा 'होम स्क्रीनवर जोडा'",
      continueToApp: "अॅपवर सुरू ठेवा",
    },
    gu: {
      title: "ન્યાય સાથી ઇન્સ્ટોલ કરો",
      description: "ગમે ત્યારે, ગમે ત્યાં કાનૂની સહાય માટે અમારી એપ ઇન્સ્ટોલ કરો.",
      installed: "એપ પહેલેથી ઇન્સ્ટોલ છે!",
      installButton: "એપ ઇન્સ્ટોલ કરો",
      iosInstructions: "શેર બટન પર ટેપ કરો, પછી 'હોમ સ્ક્રીન પર ઉમેરો'",
      androidInstructions: "મેનુ (⋮) બટન પર ટેપ કરો, પછી 'એપ ઇન્સ્ટોલ કરો' અથવા 'હોમ સ્ક્રીન પર ઉમેરો'",
      continueToApp: "એપ પર ચાલુ રાખો",
    },
    kn: {
      title: "ನ್ಯಾಯ ಸಾಥಿ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ",
      description: "ಎಲ್ಲಿಂದಲಾದರೂ, ಯಾವಾಗಲಾದರೂ ಕಾನೂನು ಸಹಾಯಕ್ಕಾಗಿ ನಮ್ಮ ಆಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ.",
      installed: "ಆಪ್ ಈಗಾಗಲೇ ಇನ್‌ಸ್ಟಾಲ್ ಆಗಿದೆ!",
      installButton: "ಆಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ",
      iosInstructions: "ಹಂಚಿಕೆ ಬಟನ್ ಟ್ಯಾಪ್ ಮಾಡಿ, ನಂತರ 'ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ'",
      androidInstructions: "ಮೆನು (⋮) ಬಟನ್ ಟ್ಯಾಪ್ ಮಾಡಿ, ನಂತರ 'ಆಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ' ಅಥವಾ 'ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ'",
      continueToApp: "ಆಪ್‌ಗೆ ಮುಂದುವರಿಸಿ",
    },
    ml: {
      title: "ന്യായ് സാഥി ഇൻസ്റ്റാൾ ചെയ്യുക",
      description: "എവിടെയും, എപ്പോഴും നിയമ സഹായത്തിനായി ഞങ്ങളുടെ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക.",
      installed: "ആപ്പ് ഇതിനകം ഇൻസ്റ്റാൾ ചെയ്തിട്ടുണ്ട്!",
      installButton: "ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക",
      iosInstructions: "ഷെയർ ബട്ടൺ ടാപ്പ് ചെയ്യുക, തുടർന്ന് 'ഹോം സ്ക്രീനിൽ ചേർക്കുക'",
      androidInstructions: "മെനു (⋮) ബട്ടൺ ടാപ്പ് ചെയ്യുക, തുടർന്ന് 'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക' അല്ലെങ്കിൽ 'ഹോം സ്ക്രീനിൽ ചേർക്കുക'",
      continueToApp: "ആപ്പിലേക്ക് തുടരുക",
    },
    pa: {
      title: "ਨਿਆਂ ਸਾਥੀ ਇੰਸਟਾਲ ਕਰੋ",
      description: "ਕਿਸੇ ਵੀ ਸਮੇਂ, ਕਿਤੇ ਵੀ ਕਾਨੂੰਨੀ ਮਦਦ ਲਈ ਸਾਡੀ ਐਪ ਇੰਸਟਾਲ ਕਰੋ।",
      installed: "ਐਪ ਪਹਿਲਾਂ ਹੀ ਇੰਸਟਾਲ ਹੈ!",
      installButton: "ਐਪ ਇੰਸਟਾਲ ਕਰੋ",
      iosInstructions: "ਸ਼ੇਅਰ ਬਟਨ ਟੈਪ ਕਰੋ, ਫਿਰ 'ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ ਸ਼ਾਮਲ ਕਰੋ'",
      androidInstructions: "ਮੀਨੂ (⋮) ਬਟਨ ਟੈਪ ਕਰੋ, ਫਿਰ 'ਐਪ ਇੰਸਟਾਲ ਕਰੋ' ਜਾਂ 'ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ ਸ਼ਾਮਲ ਕਰੋ'",
      continueToApp: "ਐਪ 'ਤੇ ਜਾਰੀ ਰੱਖੋ",
    },
    or: {
      title: "ନ୍ୟାୟ ସାଥୀ ଇନଷ୍ଟଲ କରନ୍ତୁ",
      description: "ଯେକୌଣସି ସମୟରେ, ଯେକୌଣସି ସ୍ଥାନରେ ଆଇନଗତ ସହାୟତା ପାଇଁ ଆମର ଆପ୍ ଇନଷ୍ଟଲ କରନ୍ତୁ।",
      installed: "ଆପ୍ ପୂର୍ବରୁ ଇନଷ୍ଟଲ ହୋଇଛି!",
      installButton: "ଆପ୍ ଇନଷ୍ଟଲ କରନ୍ତୁ",
      iosInstructions: "ସେୟାର ବଟନ୍ ଟ୍ୟାପ୍ କରନ୍ତୁ, ତାପରେ 'ହୋମ ସ୍କ୍ରିନରେ ଯୋଡନ୍ତୁ'",
      androidInstructions: "ମେନୁ (⋮) ବଟନ୍ ଟ୍ୟାପ୍ କରନ୍ତୁ, ତାପରେ 'ଆପ୍ ଇନଷ୍ଟଲ କରନ୍ତୁ' କିମ୍ବା 'ହୋମ ସ୍କ୍ରିନରେ ଯୋଡନ୍ତୁ'",
      continueToApp: "ଆପ୍‌ରେ ଜାରି ରଖନ୍ତୁ",
    },
    ur: {
      title: "نیائے ساتھی انسٹال کریں",
      description: "کسی بھی وقت، کہیں بھی قانونی مدد کے لیے ہماری ایپ انسٹال کریں۔",
      installed: "ایپ پہلے سے انسٹال ہے!",
      installButton: "ایپ انسٹال کریں",
      iosInstructions: "شیئر بٹن پر ٹیپ کریں، پھر 'ہوم اسکرین میں شامل کریں'",
      androidInstructions: "مینو (⋮) بٹن پر ٹیپ کریں، پھر 'ایپ انسٹال کریں' یا 'ہوم اسکرین میں شامل کریں'",
      continueToApp: "ایپ پر جاری رکھیں",
    },
  };

  const t = translations[language] || translations.en;
  const isRTL = language === "UR";

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 flex items-center justify-center p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
          <CardDescription className="text-base">{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-green-600">{t.installed}</p>
              <Button onClick={() => navigate("/")} className="w-full">
                {t.continueToApp}
              </Button>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full h-14 text-lg" size="lg">
              <Download className="mr-2 h-5 w-5" />
              {t.installButton}
            </Button>
          ) : (
            <div className="space-y-4">
              {isIOS && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Share className="w-5 h-5 text-primary" />
                    <span className="font-medium">iOS</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.iosInstructions}</p>
                </div>
              )}
              {(isAndroid || (!isIOS && !isAndroid)) && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <MoreVertical className="w-5 h-5 text-primary" />
                    <span className="font-medium">Android / Desktop</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.androidInstructions}</p>
                </div>
              )}
            </div>
          )}

          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            {t.continueToApp}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;