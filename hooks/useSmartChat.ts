import { useState, useCallback } from 'react';
import { ChatMessage, SmartChatRequest, SmartChatResponse } from '../lib/types/chat';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useSmartChat = (userId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!userId) {
      setError('User ID is not available. Please ensure you are logged in.');
      return;
    }
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const requestBody: SmartChatRequest = {
        userId,
        message: text,
        conversationId: currentConversationId,
      };

      const response = await fetch(`${API_URL}/api/smart-chat/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SmartChatResponse = await response.json();

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date(),
        source: data.source,
        apiCallSaved: data.apiCallSaved,
        userContext: data.userContext,
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentConversationId(data.conversationId);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        text: 'Failed to process smart chat request',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentConversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    currentConversationId,
  };
}; 