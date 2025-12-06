import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConsentContextType {
  hasConsented: boolean;
  setConsent: (value: boolean) => void;
  resetConsent: () => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasConsented, setHasConsented] = useState(false);

  const setConsent = (value: boolean) => {
    setHasConsented(value);
  };

  const resetConsent = () => {
    setHasConsented(false);
  };

  return (
    <ConsentContext.Provider value={{ hasConsented, setConsent, resetConsent }}>
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
