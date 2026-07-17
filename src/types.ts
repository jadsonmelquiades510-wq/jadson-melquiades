/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  username: string;
  virtualNumber: string;
  avatar: string;
  statusMessage: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'individual' | 'group';
  avatar: string;
  participants: string[]; // Virtual numbers
  createdAt: string;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderNumber: string;
  senderName: string;
  text: string; // May be encrypted
  encrypted: boolean;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  fileUrl?: string; // Base64 data or mock URL
  fileName?: string; // For documents
  fileSize?: string; // For documents/media
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string; // ISO string
  status: 'sent' | 'delivered' | 'read';
}

export interface StatusUpdate {
  id: string;
  userNumber: string;
  username: string;
  userAvatar: string;
  type: 'text' | 'image';
  content: string; // Text content or image base64
  background?: string; // Tailwind bg class for text status
  timestamp: string; // ISO string
  views: string[]; // List of userNumbers that viewed
}

export interface CallSession {
  id: string;
  callerNumber: string;
  callerName: string;
  receiverNumber: string;
  receiverName: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'missed' | 'ended' | 'declined';
  timestamp: string;
  duration: number; // in seconds
}

export interface SyncResponse {
  messages: Message[];
  chats: Chat[];
  statuses: StatusUpdate[];
  calls: CallSession[];
  activeCall?: CallSession;
}
