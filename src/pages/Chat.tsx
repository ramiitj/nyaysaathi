import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/chat/TopBar';
import BottomBar from '@/components/chat/BottomBar';
import CenterPanel from '@/components/chat/CenterPanel';
import EmergencyModal from '@/components/modals/EmergencyModal';
import AdminLoginModal from '@/components/modals/AdminLoginModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConsent } from '@/contexts/ConsentContext';
import { useConversation } from '@/hooks/useConversation';
import { useToast } from '@/hooks/use-toast';

export type VoiceState = 'idle' | 'recording' | 'processing' | 'responding';
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
  const { allConsented } = useConsent();
  const { toast } = useToast();

  // State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [transcription, setTranscription] = useState('');
  const [isConnected] = useState(true);
  
  // Modal states
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Use conversation hook for real API integration
  const { messages, isLoading, error, sendMessage, clearConversation, setMessages } = useConversation({
    language: config.code,
    locationState: undefined // Could be enhanced with geolocation
  });

  // Redirect if not consented
  useEffect(() => {
    if (!allConsented) {
      navigate('/');
    }
  }, [allConsented, navigate]);

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
    setTranscription('');
    setVoiceState('idle');
  };

  const handleSendMessage = async (content: string) => {
    setVoiceState('processing');
    
    const response = await sendMessage(content);
    
    if (response) {
      setVoiceState('responding');
      // Reset to idle after a short delay
      setTimeout(() => setVoiceState('idle'), 500);
    } else {
      setVoiceState('idle');
    }
  };

  return (
    <div className={`h-screen flex flex-col bg-gradient-warm ${config.fontClass}`}>
      <TopBar
        onStartFresh={handleStartFresh}
        onInfoClick={() => navigate('/about')}
        onEmergencyClick={() => setShowEmergencyModal(true)}
        onAdminClick={() => setShowAdminModal(true)}
      />

      <div className="flex-1 overflow-hidden">
        <CenterPanel
          voiceState={voiceState}
          setVoiceState={setVoiceState}
          inputMode={inputMode}
          transcription={transcription}
          setTranscription={setTranscription}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>

      <BottomBar
        inputMode={inputMode}
        setInputMode={setInputMode}
        isConnected={isConnected}
      />

      {/* Modals */}
      <EmergencyModal open={showEmergencyModal} onOpenChange={setShowEmergencyModal} />
      <AdminLoginModal open={showAdminModal} onOpenChange={setShowAdminModal} />
    </div>
  );
};

export default Chat;
