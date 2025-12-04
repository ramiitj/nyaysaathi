import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConsentState {
  informational: boolean;
  location: boolean;
  recording: boolean;
  privacy: boolean;
}

interface ConsentContextType {
  consent: ConsentState;
  setConsent: (key: keyof ConsentState, value: boolean) => void;
  allConsented: boolean;
  resetConsent: () => void;
}

const defaultConsent: ConsentState = {
  informational: false,
  location: false,
  recording: false,
  privacy: false,
};

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [consent, setConsentState] = useState<ConsentState>(defaultConsent);

  const setConsent = (key: keyof ConsentState, value: boolean) => {
    setConsentState(prev => ({ ...prev, [key]: value }));
  };

  const allConsented = Object.values(consent).every(Boolean);

  const resetConsent = () => {
    setConsentState(defaultConsent);
  };

  return (
    <ConsentContext.Provider value={{ consent, setConsent, allConsented, resetConsent }}>
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = (): ConsentContextType => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};