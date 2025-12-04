import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/pages/Chat';
import type { LanguageCode } from '@/config/languages';

interface UseConversationOptions {
  language: LanguageCode;
  locationState?: string;
}

export const useConversation = ({ language, locationState }: UseConversationOptions) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConversation = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-conversation', {
        body: { language, locationState }
      });

      if (error) throw error;
      
      setConversationId(data.conversationId);
      return data.conversationId;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to start conversation');
      return null;
    }
  }, [language, locationState]);

  const sendMessage = useCallback(async (content: string, fileContext?: string): Promise<Message | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create conversation if not exists
      let convId = conversationId;
      if (!convId) {
        convId = await createConversation();
        if (!convId) throw new Error('Failed to create conversation');
      }

      // Add user message to local state immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to AI with optional file context
      const { data, error } = await supabase.functions.invoke('legal-chat', {
        body: {
          message: content,
          conversationId: convId,
          language,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          locationState,
          fileContext // Include file analysis context
        }
      });

      if (error) throw error;

      // Add AI response to local state
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        citations: data.citations,
      };
      setMessages(prev => [...prev, assistantMessage]);

      return assistantMessage;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to get response. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, createConversation, language, locationState, messages]);

  const clearConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    conversationId,
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    setMessages
  };
};
