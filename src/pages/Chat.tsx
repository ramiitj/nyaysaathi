import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/chat/TopBar';
import BottomBar from '@/components/chat/BottomBar';
import LeftPanel from '@/components/chat/LeftPanel';
import CenterPanel from '@/components/chat/CenterPanel';
import RightPanel from '@/components/chat/RightPanel';
import InfoModal from '@/components/modals/InfoModal';
import EmergencyModal from '@/components/modals/EmergencyModal';
import ResourcesModal from '@/components/modals/ResourcesModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConsent } from '@/contexts/ConsentContext';
import { useIsMobile } from '@/hooks/use-mobile';

export type VoiceState = 'idle' | 'recording' | 'processing' | 'responding';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Array<{ act: string; section: string; text: string }>;
}

export interface LegalContext {
  domain: string;
  jurisdiction: string;
  relevantActs: string[];
  caseType: string;
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useLanguage();
  const { allConsented } = useConsent();
  const isMobile = useIsMobile();

  // State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcription, setTranscription] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [location, setLocation] = useState({ city: 'Delhi', state: 'Delhi' });
  
  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);

  // Legal context
  const [legalContext, setLegalContext] = useState<LegalContext>({
    domain: 'Not detected',
    jurisdiction: `${location.city}, ${location.state}`,
    relevantActs: [],
    caseType: 'General Query',
  });

  // Documents
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);

  // Redirect if not consented
  useEffect(() => {
    if (!allConsented) {
      navigate('/');
    }
  }, [allConsented, navigate]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // In production, use reverse geocoding API
          // For now, use default
          setLocation({ city: 'Mumbai', state: 'Maharashtra' });
          setLegalContext(prev => ({
            ...prev,
            jurisdiction: 'Mumbai, Maharashtra',
          }));
        },
        () => {
          // Use default if denied
          console.log('Location access denied, using default');
        }
      );
    }
  }, []);

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    const totalSize = [...uploadedFiles, ...files].reduce((acc, f) => acc + f.size, 0);
    setStorageUsed(totalSize);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      const totalSize = newFiles.reduce((acc, f) => acc + f.size, 0);
      setStorageUsed(totalSize);
      return newFiles;
    });
  };

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response (will be replaced with actual API call)
    setVoiceState('processing');
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${config.disclaimer}\n\nThank you for your question. I'll help you understand the legal aspects of your query. This is a demo response - the actual AI integration will provide relevant legal information based on Indian laws and your jurisdiction.`,
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
    <div className={`h-screen flex flex-col bg-background ${config.fontClass}`}>
      <TopBar
        onInfoClick={() => setShowInfoModal(true)}
        onEmergencyClick={() => setShowEmergencyModal(true)}
        onResourcesClick={() => setShowResourcesModal(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Hidden on mobile */}
        {!isMobile && (
          <div className="w-72 border-r border-border bg-card/50 overflow-y-auto animate-slide-in-left">
            <LeftPanel legalContext={legalContext} />
          </div>
        )}

        {/* Center Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CenterPanel
            voiceState={voiceState}
            setVoiceState={setVoiceState}
            transcription={transcription}
            setTranscription={setTranscription}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Right Panel - Hidden on mobile */}
        {!isMobile && (
          <div className="w-80 border-l border-border bg-card/50 overflow-y-auto animate-slide-in-right">
            <RightPanel
              uploadedFiles={uploadedFiles}
              storageUsed={storageUsed}
              onFilesUploaded={handleFilesUploaded}
              onRemoveFile={handleRemoveFile}
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>

      <BottomBar
        location={location}
        isConnected={isConnected}
        sessionTime={sessionTime}
      />

      {/* Modals */}
      <InfoModal open={showInfoModal} onOpenChange={setShowInfoModal} />
      <EmergencyModal open={showEmergencyModal} onOpenChange={setShowEmergencyModal} />
      <ResourcesModal open={showResourcesModal} onOpenChange={setShowResourcesModal} />
    </div>
  );
};

export default Chat;