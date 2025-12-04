export type LanguageCode = 'HI' | 'EN' | 'BN' | 'TA' | 'TE' | 'MR' | 'GU' | 'KN' | 'ML' | 'PA' | 'OR' | 'UR';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  fontClass: string;
  direction: 'ltr' | 'rtl';
  ttsVoice: string;
  disclaimer: string;
  ui: {
    startConsultation: string;
    tapToSpeak: string;
    listening: string;
    analyzing: string;
    speaking: string;
    uploadDocument: string;
    typeMessage: string;
    send: string;
    emergency: string;
    resources: string;
    info: string;
    admin: string;
  };
}

export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  HI: {
    code: 'HI',
    name: 'Hindi',
    nativeName: 'हिंदी',
    fontClass: 'font-hindi',
    direction: 'ltr',
    ttsVoice: 'hi-IN-Neural2-A',
    disclaimer: '⚠️ यह कानूनी सलाह नहीं है। यह केवल सामान्य जानकारी है।',
    ui: {
      startConsultation: 'कानूनी परामर्श शुरू करें',
      tapToSpeak: 'बोलने के लिए टैप करें',
      listening: 'सुन रहा हूँ...',
      analyzing: 'विश्लेषण कर रहा हूँ...',
      speaking: 'बोल रहा हूँ...',
      uploadDocument: 'दस्तावेज़ अपलोड करें',
      typeMessage: 'अपना संदेश लिखें...',
      send: 'भेजें',
      emergency: 'आपातकाल',
      resources: 'संसाधन',
      info: 'जानकारी',
      admin: 'व्यवस्थापक',
    },
  },
  EN: {
    code: 'EN',
    name: 'English',
    nativeName: 'English',
    fontClass: 'font-sans',
    direction: 'ltr',
    ttsVoice: 'en-IN-Neural2-A',
    disclaimer: '⚠️ This is NOT legal advice. General information only.',
    ui: {
      startConsultation: 'Start Legal Consultation',
      tapToSpeak: 'Tap to speak',
      listening: 'Listening...',
      analyzing: 'Analyzing...',
      speaking: 'Speaking...',
      uploadDocument: 'Upload Document',
      typeMessage: 'Type your message...',
      send: 'Send',
      emergency: 'Emergency',
      resources: 'Resources',
      info: 'Info',
      admin: 'Admin',
    },
  },
  BN: {
    code: 'BN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    fontClass: 'font-bengali',
    direction: 'ltr',
    ttsVoice: 'bn-IN-Neural2-A',
    disclaimer: '⚠️ এটি আইনি পরামর্শ নয়। শুধুমাত্র সাধারণ তথ্য।',
    ui: {
      startConsultation: 'আইনি পরামর্শ শুরু করুন',
      tapToSpeak: 'কথা বলতে ট্যাপ করুন',
      listening: 'শুনছি...',
      analyzing: 'বিশ্লেষণ করছি...',
      speaking: 'বলছি...',
      uploadDocument: 'নথি আপলোড করুন',
      typeMessage: 'আপনার বার্তা লিখুন...',
      send: 'পাঠান',
      emergency: 'জরুরি',
      resources: 'সম্পদ',
      info: 'তথ্য',
      admin: 'অ্যাডমিন',
    },
  },
  TA: {
    code: 'TA',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    fontClass: 'font-tamil',
    direction: 'ltr',
    ttsVoice: 'ta-IN-Neural2-A',
    disclaimer: '⚠️ இது சட்ட ஆலோசனை அல்ல। பொது தகவல் மட்டுமே।',
    ui: {
      startConsultation: 'சட்ட ஆலோசனை தொடங்கு',
      tapToSpeak: 'பேச தட்டவும்',
      listening: 'கேட்கிறேன்...',
      analyzing: 'பகுப்பாய்வு செய்கிறேன்...',
      speaking: 'பேசுகிறேன்...',
      uploadDocument: 'ஆவணத்தை பதிவேற்றவும்',
      typeMessage: 'உங்கள் செய்தியை எழுதுங்கள்...',
      send: 'அனுப்பு',
      emergency: 'அவசரம்',
      resources: 'வளங்கள்',
      info: 'தகவல்',
      admin: 'நிர்வாகி',
    },
  },
  TE: {
    code: 'TE',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    fontClass: 'font-telugu',
    direction: 'ltr',
    ttsVoice: 'te-IN-Neural2-A',
    disclaimer: '⚠️ ఇది చట్టపరమైన సలహా కాదు. సాధారణ సమాచారం మాత్రమే।',
    ui: {
      startConsultation: 'చట్టపరమైన సలహా ప్రారంభించండి',
      tapToSpeak: 'మాట్లాడటానికి నొక్కండి',
      listening: 'వింటున్నాను...',
      analyzing: 'విశ్లేషిస్తున్నాను...',
      speaking: 'మాట్లాడుతున్నాను...',
      uploadDocument: 'పత్రం అప్‌లోడ్ చేయండి',
      typeMessage: 'మీ సందేశం టైప్ చేయండి...',
      send: 'పంపండి',
      emergency: 'అత్యవసర',
      resources: 'వనరులు',
      info: 'సమాచారం',
      admin: 'నిర్వాహకుడు',
    },
  },
  MR: {
    code: 'MR',
    name: 'Marathi',
    nativeName: 'मराठी',
    fontClass: 'font-hindi',
    direction: 'ltr',
    ttsVoice: 'mr-IN-Neural2-A',
    disclaimer: '⚠️ हा कायदेशीर सल्ला नाही. केवळ सामान्य माहिती।',
    ui: {
      startConsultation: 'कायदेशीर सल्ला सुरू करा',
      tapToSpeak: 'बोलण्यासाठी टॅप करा',
      listening: 'ऐकत आहे...',
      analyzing: 'विश्लेषण करत आहे...',
      speaking: 'बोलत आहे...',
      uploadDocument: 'दस्तऐवज अपलोड करा',
      typeMessage: 'तुमचा संदेश टाइप करा...',
      send: 'पाठवा',
      emergency: 'आणीबाणी',
      resources: 'संसाधने',
      info: 'माहिती',
      admin: 'प्रशासक',
    },
  },
  GU: {
    code: 'GU',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    fontClass: 'font-gujarati',
    direction: 'ltr',
    ttsVoice: 'gu-IN-Neural2-A',
    disclaimer: '⚠️ આ કાનૂની સલાહ નથી. ફક્ત સામાન્ય માહિતી।',
    ui: {
      startConsultation: 'કાનૂની સલાહ શરૂ કરો',
      tapToSpeak: 'બોલવા માટે ટૅપ કરો',
      listening: 'સાંભળી રહ્યો છું...',
      analyzing: 'વિશ્લેષણ કરી રહ્યો છું...',
      speaking: 'બોલી રહ્યો છું...',
      uploadDocument: 'દસ્તાવેજ અપલોડ કરો',
      typeMessage: 'તમારો સંદેશ લખો...',
      send: 'મોકલો',
      emergency: 'કટોકટી',
      resources: 'સંસાધનો',
      info: 'માહિતી',
      admin: 'સંચાલક',
    },
  },
  KN: {
    code: 'KN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    fontClass: 'font-kannada',
    direction: 'ltr',
    ttsVoice: 'kn-IN-Neural2-A',
    disclaimer: '⚠️ ಇದು ಕಾನೂನು ಸಲಹೆ ಅಲ್ಲ. ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ಮಾತ್ರ।',
    ui: {
      startConsultation: 'ಕಾನೂನು ಸಮಾಲೋಚನೆ ಪ್ರಾರಂಭಿಸಿ',
      tapToSpeak: 'ಮಾತನಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
      listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ...',
      analyzing: 'ವಿಶ್ಲೇಷಿಸುತ್ತಿದ್ದೇನೆ...',
      speaking: 'ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ...',
      uploadDocument: 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
      typeMessage: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
      send: 'ಕಳುಹಿಸಿ',
      emergency: 'ತುರ್ತು',
      resources: 'ಸಂಪನ್ಮೂಲಗಳು',
      info: 'ಮಾಹಿತಿ',
      admin: 'ನಿರ್ವಾಹಕ',
    },
  },
  ML: {
    code: 'ML',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    fontClass: 'font-malayalam',
    direction: 'ltr',
    ttsVoice: 'ml-IN-Neural2-A',
    disclaimer: '⚠️ ഇത് നിയമ ഉപദേശമല്ല. പൊതു വിവരങ്ങൾ മാത്രം।',
    ui: {
      startConsultation: 'നിയമ കൺസൾട്ടേഷൻ ആരംഭിക്കുക',
      tapToSpeak: 'സംസാരിക്കാൻ ടാപ്പ് ചെയ്യുക',
      listening: 'കേൾക്കുന്നു...',
      analyzing: 'വിശകലനം ചെയ്യുന്നു...',
      speaking: 'സംസാരിക്കുന്നു...',
      uploadDocument: 'രേഖ അപ്‌ലോഡ് ചെയ്യുക',
      typeMessage: 'നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക...',
      send: 'അയയ്ക്കുക',
      emergency: 'അടിയന്തരം',
      resources: 'വിഭവങ്ങൾ',
      info: 'വിവരങ്ങൾ',
      admin: 'അഡ്മിൻ',
    },
  },
  PA: {
    code: 'PA',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    fontClass: 'font-punjabi',
    direction: 'ltr',
    ttsVoice: 'pa-IN-Neural2-A',
    disclaimer: '⚠️ ਇਹ ਕਾਨੂੰਨੀ ਸਲਾਹ ਨਹੀਂ ਹੈ। ਸਿਰਫ਼ ਆਮ ਜਾਣਕਾਰੀ।',
    ui: {
      startConsultation: 'ਕਾਨੂੰਨੀ ਸਲਾਹ ਸ਼ੁਰੂ ਕਰੋ',
      tapToSpeak: 'ਬੋਲਣ ਲਈ ਟੈਪ ਕਰੋ',
      listening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ...',
      analyzing: 'ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਿਹਾ ਹਾਂ...',
      speaking: 'ਬੋਲ ਰਿਹਾ ਹਾਂ...',
      uploadDocument: 'ਦਸਤਾਵੇਜ਼ ਅੱਪਲੋਡ ਕਰੋ',
      typeMessage: 'ਆਪਣਾ ਸੁਨੇਹਾ ਟਾਈਪ ਕਰੋ...',
      send: 'ਭੇਜੋ',
      emergency: 'ਐਮਰਜੈਂਸੀ',
      resources: 'ਸਰੋਤ',
      info: 'ਜਾਣਕਾਰੀ',
      admin: 'ਪ੍ਰਬੰਧਕ',
    },
  },
  OR: {
    code: 'OR',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    fontClass: 'font-odia',
    direction: 'ltr',
    ttsVoice: 'or-IN-Standard-A',
    disclaimer: '⚠️ ଏହା ଆଇନଗତ ପରାମର୍ଶ ନୁହେଁ। କେବଳ ସାଧାରଣ ସୂଚନା।',
    ui: {
      startConsultation: 'ଆଇନଗତ ପରାମର୍ଶ ଆରମ୍ଭ କରନ୍ତୁ',
      tapToSpeak: 'କହିବାକୁ ଟ୍ୟାପ୍ କରନ୍ତୁ',
      listening: 'ଶୁଣୁଛି...',
      analyzing: 'ବିଶ୍ଲେଷଣ କରୁଛି...',
      speaking: 'କହୁଛି...',
      uploadDocument: 'ଡକ୍ୟୁମେଣ୍ଟ ଅପଲୋଡ୍ କରନ୍ତୁ',
      typeMessage: 'ଆପଣଙ୍କ ସନ୍ଦେଶ ଟାଇପ୍ କରନ୍ତୁ...',
      send: 'ପଠାନ୍ତୁ',
      emergency: 'ଜରୁରୀ',
      resources: 'ସମ୍ବଳ',
      info: 'ସୂଚନା',
      admin: 'ପ୍ରଶାସକ',
    },
  },
  UR: {
    code: 'UR',
    name: 'Urdu',
    nativeName: 'اردو',
    fontClass: 'font-urdu',
    direction: 'rtl',
    ttsVoice: 'ur-IN-Standard-A',
    disclaimer: '⚠️ یہ قانونی مشورہ نہیں ہے۔ صرف عام معلومات۔',
    ui: {
      startConsultation: 'قانونی مشاورت شروع کریں',
      tapToSpeak: 'بولنے کے لیے ٹیپ کریں',
      listening: 'سن رہا ہوں...',
      analyzing: 'تجزیہ کر رہا ہوں...',
      speaking: 'بول رہا ہوں...',
      uploadDocument: 'دستاویز اپلوڈ کریں',
      typeMessage: 'اپنا پیغام ٹائپ کریں...',
      send: 'بھیجیں',
      emergency: 'ایمرجنسی',
      resources: 'وسائل',
      info: 'معلومات',
      admin: 'منتظم',
    },
  },
};

export const DEFAULT_LANGUAGE: LanguageCode = 'EN';

export const getLanguageConfig = (code: LanguageCode): LanguageConfig => {
  return LANGUAGES[code] || LANGUAGES[DEFAULT_LANGUAGE];
};

export const getAllLanguages = (): LanguageConfig[] => {
  return Object.values(LANGUAGES);
};