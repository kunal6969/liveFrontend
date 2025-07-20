

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, RoomLocation, DirectMessage } from '../types';
import { getMessagesForUser, markMessagesAsRead } from '../services/messagingService';
import LoadingIndicator from '../components/LoadingIndicator';
import { Button } from '../components/UIElements';
import SendMessageModal from '../components/SendMessageModal'; // For potential reply functionality
import { EnvelopeIcon, ChatBubbleIcon, MailboxIcon } from '../components/VibrantIcons';


interface Conversation {
  partnerId: string;
  partnerName: string;
  listingId: string;
  listingRoomSummary: string;
  messages: DirectMessage[];
  lastMessageTimestamp: string;
  unreadCount: number;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // For reply modal
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyModalData, setReplyModalData] = useState<{lister: {id: string, fullName: string}, listing: {id: string, roomDetails: any, roomSummary: string}} | null>(null);


  const loadConversations = useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    setTimeout(() => { // Simulate async
      const userMessages = getMessagesForUser(user.id);
      const groupedMessages: Record<string, Conversation> = {};

      userMessages.forEach(msg => {
        const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        const partnerName = msg.senderId === user.id ? msg.receiverName : msg.senderName;
        const conversationKey = `${partnerId}-${msg.listingId}`;

        if (!groupedMessages[conversationKey]) {
          groupedMessages[conversationKey] = {
            partnerId,
            partnerName,
            listingId: msg.listingId,
            listingRoomSummary: msg.listingRoomSummary,
            messages: [],
            lastMessageTimestamp: '1970-01-01T00:00:00.000Z',
            unreadCount: 0,
          };
        }
        groupedMessages[conversationKey].messages.push(msg);
        if (new Date(msg.timestamp) > new Date(groupedMessages[conversationKey].lastMessageTimestamp)) {
          groupedMessages[conversationKey].lastMessageTimestamp = msg.timestamp;
        }
        if (msg.receiverId === user.id && !msg.isReadByReceiver) {
          groupedMessages[conversationKey].unreadCount++;
        }
      });
      
      const convArray = Object.values(groupedMessages).sort((a,b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
      setConversations(convArray);
      // Automatically select the first conversation if none is selected
      if (!selectedConversation && convArray.length > 0) {
        handleSelectConversation(convArray[0], true); // Pass a flag to prevent re-reading messages
      }
      setIsLoading(false);
    }, 300);
  }, [user, selectedConversation]);

  useEffect(() => {
    loadConversations();
    const intervalId = setInterval(loadConversations, 5000); // Periodically check for new messages
    return () => clearInterval(intervalId);
  }, [loadConversations]);

  const handleSelectConversation = (conv: Conversation, isInitialLoad = false) => {
    setSelectedConversation(conv);
    if (user && conv.unreadCount > 0 && !isInitialLoad) {
      const unreadMessageIds = conv.messages.filter(m => m.receiverId === user.id && !m.isReadByReceiver).map(m => m.id);
      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(unreadMessageIds, user.id);
        // Refresh conversations to update unread counts everywhere
        loadConversations();
      }
    }
  };

  const handleOpenReplyModal = (conv: Conversation) => {
    if (!user) return;
    setReplyModalData({
        lister: { id: conv.partnerId, fullName: conv.partnerName }, 
        listing: { 
            id: conv.listingId, 
            roomDetails: {} as RoomLocation,
            roomSummary: conv.listingRoomSummary 
        }
    });
    setIsReplyModalOpen(true);
  };
  

  if (isLoading && conversations.length === 0) return <LoadingIndicator message="Loading messages..." />;
  if (!user) return <p className="text-center text-red-500">User not found. Please log in.</p>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
        <EnvelopeIcon className="w-8 h-8" /> Your Messages
      </h1>
      
      {isReplyModalOpen && replyModalData && user && (
        <SendMessageModal
            isOpen={isReplyModalOpen}
            onClose={() => {setIsReplyModalOpen(false); loadConversations();}}
            currentUser={user}
            lister={replyModalData.lister}
            listing={replyModalData.listing}
        />
      )}

      {conversations.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white/80 dark:bg-black/30 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-white/10">
           <MailboxIcon className="mx-auto h-16 w-16"/>
           <h3 className="mt-4 text-xl font-medium text-slate-900 dark:text-white">No Messages Yet</h3>
           <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Start a conversation by messaging a lister from a room card.</p>
        </div>
      )}

      <div className="grid md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-0 bg-white/80 dark:bg-black/30 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden h-[calc(100vh-220px)]">
        {/* Conversations List */}
        <div className="border-r border-slate-200/90 dark:border-white/10 h-full overflow-y-auto"> 
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 p-4 border-b border-slate-200/90 dark:border-white/10 sticky top-0 bg-white/80 dark:bg-black/50 backdrop-blur-lg z-10 flex items-center gap-2">
            <ChatBubbleIcon className="w-6 h-6"/> Conversations
          </h2>
          <div className="divide-y divide-slate-200/90 dark:divide-white/10">
            {conversations.map(conv => (
              <div 
                key={`${conv.partnerId}-${conv.listingId}`} 
                onClick={() => handleSelectConversation(conv)}
                className={`p-4 cursor-pointer transition-colors
                            ${selectedConversation?.partnerId === conv.partnerId && selectedConversation?.listingId === conv.listingId ? 'bg-indigo-500/20 dark:bg-indigo-500/30' : 'hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20'}`}
              >
                <div className="flex justify-between items-center">
                  <p className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>{conv.partnerName}</p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">{conv.unreadCount}</span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">Room: {conv.listingRoomSummary}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                  {conv.messages[conv.messages.length-1]?.senderId === user.id ? "You: " : ""}
                  {conv.messages[conv.messages.length-1]?.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Conversation Details */}
        <div className="p-4 flex flex-col h-full bg-black/5 dark:bg-black/10">
          {selectedConversation ? (
            <>
              <div className="border-b border-slate-200/90 dark:border-white/10 pb-3 mb-3 flex-shrink-0"> 
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <ChatBubbleIcon className="w-7 h-7"/> Chat with {selectedConversation.partnerName}
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300">Regarding: {selectedConversation.listingRoomSummary}</p>
              </div>
              <div className="flex-grow overflow-y-auto space-y-4 p-2">
                {selectedConversation.messages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-lg max-w-[80%] shadow-md ${msg.senderId === user.id ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-white dark:bg-white/10 backdrop-blur-md text-slate-800 dark:text-slate-200'}`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className={`text-xs mt-1 px-1 text-slate-500 dark:text-slate-400`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200/90 dark:border-white/10 flex-shrink-0">
                <Button onClick={() => handleOpenReplyModal(selectedConversation)} className="w-full" leftIcon={<ChatBubbleIcon />}> 
                    Reply to {selectedConversation.partnerName}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <EnvelopeIcon className="h-20 w-20 text-slate-400 mb-4" />
              <p className="text-lg text-slate-700 dark:text-slate-300">👈 Select a conversation to view messages.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your message history will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
