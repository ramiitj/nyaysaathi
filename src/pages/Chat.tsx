import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/chat/TopBar';
import BottomBar from '@/components/chat/BottomBar';
import CenterPanel from '@/components/chat/CenterPanel';
import EmergencyModal from '@/components/modals/EmergencyModal';
import AdminLoginModal from '@/components/modals/AdminLoginModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConsent } from '@/contexts/ConsentContext';

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

  // State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcription, setTranscription] = useState('');
  const [isConnected] = useState(true);
  
  // Modal states
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Redirect if not consented
  useEffect(() => {
    if (!allConsented) {
      navigate('/');
    }
  }, [allConsented, navigate]);

  const handleStartFresh = () => {
    setMessages([]);
    setTranscription('');
    setVoiceState('idle');
  };

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response
    setVoiceState('processing');
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${config.disclaimer}\n\nThank you for your question about "${content.slice(0, 50)}...". I'll help you understand the legal aspects. This is a demo response - the actual AI integration will provide relevant legal information based on Indian laws.`,
        timestamp: new Date(),
        citations: [
          { act: 'Indian Penal Code', section: '420', text: 'Cheating and dishonestly inducing delivery of property' }
        ],
      };
      setMessages(prev => [...prev, assistantMessage]);
      setVoiceState('idle');
    }, 2000);
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
