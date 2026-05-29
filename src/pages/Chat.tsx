import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TopBar from '@/components/chat/TopBar';
import BottomBar from '@/components/chat/BottomBar';
import CenterPanel from '@/components/chat/CenterPanel';
import EmergencyModal from '@/components/modals/EmergencyModal';
import AdminLoginModal from '@/components/modals/AdminLoginModal';
import OnboardingTooltips from '@/components/chat/OnboardingTooltips';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConsent } from '@/contexts/ConsentContext';
import { useConversation } from '@/hooks/useConversation';
import { useUserFingerprint } from '@/hooks/useUserFingerprint';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

export type InputMode = 'voice' | 'text';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Array<{ act: string; section: string; text: string }>;
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useLanguage();
  const { hasConsented, resetConsent } = useConsent();
  const { toast } = useToast();

  // State - simplified, voice state is now managed in CenterPanel
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [isConnected] = useState(true);
  
  // Modal states
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // User fingerprinting for tracking and onboarding
  const { 
    visitorId, 
    isFirstTimeUser, 
    isLoading: visitorLoading,
    requestLocation,
    markOnboardingComplete 
  } = useUserFingerprint();

  // Use conversation hook for real API integration
  const { messages, isLoading, error, sendMessage, clearConversation, conversationId } = useConversation({
    language: config.code,
    locationState: undefined
  });

  // File upload hook
  const {
    uploadedFiles,
    storageUsed,
    maxStorage,
    isUploading,
    uploadFiles,
    removeFile,
    clearAllFiles,
    getFileContext,
  } = useFileUpload({
    visitorId: visitorId || undefined,
    conversationId,
    language: config.code,
  });

  // Redirect if not consented
  useEffect(() => {
    if (!hasConsented) {
      navigate('/');
    }
  }, [hasConsented, navigate]);

  // Request location on mount (after consent)
  useEffect(() => {
    if (hasConsented && visitorId) {
      requestLocation();
    }
  }, [hasConsented, visitorId, requestLocation]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  const handleStartFresh = () => {
    clearConversation();
    clearAllFiles();
    resetConsent();
    navigate('/');
  };

  const handleSendMessage = async (content: string) => {
    const fileContext = getFileContext();
    await sendMessage(content, fileContext);
  };

  const handleFilesSelected = async (files: File[]) => {
    await uploadFiles(files);
  };

  const handleOnboardingComplete = () => {
    markOnboardingComplete();
  };

  return (
    <div className={`h-screen flex flex-col bg-gradient-warm ${config.fontClass}`}>
      <Helmet>
        <title>Legal Consultation — Nyay Saathi</title>
        <meta name="description" content="Ask legal questions by voice or text in your language. Confidential AI guidance on Indian laws, rights and acts." />
        <link rel="canonical" href="https://nyaysaathi.info/chat" />
        <meta property="og:title" content="Legal Consultation — Nyay Saathi" />
        <meta property="og:description" content="Voice-first legal consultation in 12 Indian languages." />
        <meta property="og:url" content="https://nyaysaathi.info/chat" />
      </Helmet>
      <TopBar
        onStartFresh={handleStartFresh}
        onInfoClick={() => navigate('/about')}
        onEmergencyClick={() => setShowEmergencyModal(true)}
        onAdminClick={() => setShowAdminModal(true)}
        config={config}
      />

      <h1 className="sr-only">Legal Consultation</h1>

      <main className="flex-1 overflow-hidden">
        <CenterPanel
          inputMode={inputMode}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>

      <BottomBar
        inputMode={inputMode}
        setInputMode={setInputMode}
        isConnected={isConnected}
        config={config}
        uploadedFiles={uploadedFiles}
        storageUsed={storageUsed}
        maxStorage={maxStorage}
        isUploading={isUploading}
        onFilesSelected={handleFilesSelected}
        onRemoveFile={removeFile}
      />

      {/* Modals */}
      <EmergencyModal open={showEmergencyModal} onOpenChange={setShowEmergencyModal} />
      <AdminLoginModal open={showAdminModal} onOpenChange={setShowAdminModal} />

      {/* First-time user onboarding tooltips */}
      {!visitorLoading && isFirstTimeUser && (
        <OnboardingTooltips onComplete={handleOnboardingComplete} config={config} />
      )}
    </div>
  );
};

export default Chat;