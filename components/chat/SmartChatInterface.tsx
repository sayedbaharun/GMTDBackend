'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { ChatMessage } from '../../lib/types/chat';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  currentConversationId?: string | null;
}

const SmartChatInterface: React.FC<SmartChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  error, 
  sendMessage 
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    
    const messageText = inputText;
    setInputText('');
    await sendMessage(messageText);
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-navy/90 backdrop-blur-xl rounded-xl border border-gold/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold to-amber-500 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-navy font-bold text-lg">GMTD Smart Concierge</h3>
          <span className="text-navy/70 text-sm">VIP Access Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-gold to-amber-500 text-navy'
                    : message.sender === 'system'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-gradient-to-r from-navy/70 to-navy/50 text-ivory border border-gold/20'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                
                {/* Message metadata */}
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{formatTime(message.timestamp)}</span>
                  {message.source && (
                    <span className="flex items-center space-x-1">
                      {message.apiCallSaved && (
                        <span className="text-green-400">💰 API Saved</span>
                      )}
                      <span>
                        {message.source === 'knowledge_base' ? '🧠 KB' : '🤖 AI'}
                      </span>
                    </span>
                  )}
                </div>

                {/* User context suggestions */}
                {message.userContext?.suggestions && message.userContext.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.userContext.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(suggestion)}
                        className="px-3 py-1 text-xs bg-gold/20 hover:bg-gold/30 text-gold rounded-full transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gradient-to-r from-navy/70 to-navy/50 text-ivory border border-gold/20 p-4 rounded-2xl">
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="w-4 h-4 animate-spin text-gold" />
                <span className="text-sm">GMTD Concierge is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-4 rounded-2xl">
              <div className="flex items-center space-x-2">
                <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
                <span className="text-sm">Failed to process smart chat request</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-gold/20">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask your luxury concierge..."
            className="flex-1 px-4 py-3 bg-navy/50 border border-gold/30 rounded-xl text-ivory placeholder-ivory/50 focus:outline-none focus:border-gold/60 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-navy font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SmartChatInterface; 