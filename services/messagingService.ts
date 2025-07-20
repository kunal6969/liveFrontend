
import { DirectMessage } from '../types';

const MESSAGES_STORAGE_KEY = 'mnitHostelDirectMessages';

export const getMessages = (): DirectMessage[] => {
  const storedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
  return storedMessages ? JSON.parse(storedMessages) : [];
};

export const saveMessage = (newMessage: Omit<DirectMessage, 'id' | 'timestamp' | 'isReadByReceiver' | 'senderName' | 'receiverName'>, senderName: string, receiverName: string): DirectMessage => {
  const messages = getMessages();
  const messageWithDetails: DirectMessage = {
    ...newMessage,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    isReadByReceiver: false,
    senderName,
    receiverName,
  };
  messages.push(messageWithDetails);
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  return messageWithDetails;
};

// Get all messages where the user is either a sender or receiver
export const getMessagesForUser = (userId: string): DirectMessage[] => {
  return getMessages()
    .filter(msg => msg.senderId === userId || msg.receiverId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getReceivedMessages = (userId: string): DirectMessage[] => {
  return getMessages()
    .filter(msg => msg.receiverId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getSentMessages = (userId: string): DirectMessage[] => {
  return getMessages()
    .filter(msg => msg.senderId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const markMessagesAsRead = (messageIds: string[], currentUserId: string): void => {
  let messages = getMessages();
  let changed = false;
  messages = messages.map(msg => {
    if (messageIds.includes(msg.id) && msg.receiverId === currentUserId && !msg.isReadByReceiver) {
      changed = true;
      return { ...msg, isReadByReceiver: true };
    }
    return msg;
  });
  if (changed) {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }
};

export const countUnreadMessages = (userId: string): number => {
  return getMessages().filter(msg => msg.receiverId === userId && !msg.isReadByReceiver).length;
};
