'use client';

import React, { useEffect } from 'react';
import SmartChatInterface from '../../../components/chat/SmartChatInterface';
import { useSmartChat } from '../../../hooks/useSmartChat';

const ChatPage = () => {
  const gmtdUserId = 'demo-user';

  const {
    messages,
    isLoading: isChatLoading,
    error: chatError,
    sendMessage,
    currentConversationId
  } = useSmartChat(gmtdUserId);

  // fire once to get first response so spinner disappears
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage('Hello');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy">
      <SmartChatInterface
        messages={messages}
        isLoading={isChatLoading}
        error={chatError}
        sendMessage={sendMessage}
        currentConversationId={currentConversationId}
      />
    </div>
  );
};

export default ChatPage; 