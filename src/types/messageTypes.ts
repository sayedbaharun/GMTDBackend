/**
 * # Message System Types
 * Type definitions for the messaging system between users and admins
 */

export type ConversationStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';
export type ConversationType = 'SUPPORT' | 'BOOKING_RELATED' | 'GENERAL';
export type ParticipantRole = 'CLIENT' | 'AGENT' | 'ADMIN';
export type MessageContentType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface Participant {
  id: string;
  fullName: string | null;
  email: string;
  isAdmin: boolean;
  role: ParticipantRole;
}

export interface Message {
  id: string;
  content: string;
  contentType: MessageContentType;
  sender: {
    id: string;
    fullName: string | null;
    email: string;
    isAdmin: boolean;
  };
  attachmentUrl?: string | null;
  isSystem: boolean;
  createdAt: Date;
}

export interface RelatedBooking {
  id: string;
  status: string;
}

export interface ConversationPreview {
  id: string;
  title: string | null;
  status: ConversationStatus;
  type: ConversationType;
  createdAt: Date;
  updatedAt: Date;
  participants: Participant[];
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;
  relatedBooking: RelatedBooking | null;
  unreadCount: number;
}

export interface Conversation extends Omit<ConversationPreview, 'lastMessage'> {
  messages: Message[];
}

// Request and response types

export interface CreateConversationRequest {
  title?: string;
  type?: ConversationType;
  relatedBookingId?: string;
}

export interface SendMessageRequest {
  content: string;
  contentType?: MessageContentType;
  attachmentUrl?: string;
}

export interface UnreadCountResponse {
  totalUnread: number;
  unreadByConversation: Record<string, number>;
} 