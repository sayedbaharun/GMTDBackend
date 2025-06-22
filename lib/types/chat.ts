export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  source?: 'knowledge_base' | 'ai_with_context';
  apiCallSaved?: boolean;
  userContext?: {
    intent?: string;
    mood?: string;
    entities?: any;
    suggestions?: string[];
  };
}

export interface SmartChatResponse {
  response: string;
  source: 'knowledge_base' | 'ai_with_context';
  apiCallSaved: boolean;
  conversationId: string;
  userContext?: {
    intent?: string;
    mood?: string;
    entities?: any;
    suggestions?: string[];
  };
  travelRequest?: {
    id: string;
    type: string;
    status: string;
  } | null;
}

export interface SmartChatRequest {
  userId: string;
  message: string;
  conversationId?: string | null;
} 