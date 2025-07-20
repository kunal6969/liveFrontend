
import { CommonChatMessage, Poll, PollMessage, PollOption, TextMessage, ImageMessage } from '../types';

const CHAT_STORAGE_KEY = 'mnitCommonChatMessages';

// === MOCK INITIAL DATA (for demonstration) ===
const createInitialMockData = () => {
    const mockMessages: CommonChatMessage[] = [
        {
            id: `msg-1678886400000-1`,
            type: 'text',
            sender: { id: 'user-amit-verma', name: 'Amit Verma' },
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
            content: "Hey everyone! Anyone know when the mid-term results are coming out?"
        },
        {
            id: `msg-1678886400000-2`,
            type: 'text',
            sender: { id: 'user-priya-mehta', name: 'Priya Mehta' },
            timestamp: new Date(Date.now() - 86400000 * 1.9).toISOString(),
            content: "I heard maybe next week. Not sure though."
        },
        {
            id: `msg-1678886400000-3`,
            type: 'poll',
            sender: { id: 'anonymous', name: 'Anonymous' },
            timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
            poll: {
                id: 'poll-1',
                question: 'Best place for late-night snacks near campus?',
                options: [
                    { text: 'Annapurna', voters: ['user-amit-verma'] },
                    { text: 'Gopalpura Bypass dhabas', voters: ['user-priya-mehta', 'user-rohan-sharma'] },
                    { text: 'My own maggi', voters: [] }
                ]
            }
        },
        {
            id: `msg-1678886400000-4`,
            type: 'text',
            sender: { id: 'anonymous', name: 'Anonymous' },
            timestamp: new Date(Date.now() - 86400000 * 1.4).toISOString(),
            content: "Gopalpura dhabas are legendary for a reason."
        }
    ];
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(mockMessages));
    return mockMessages;
}


// === SERVICE FUNCTIONS ===

export const getChatMessages = (): CommonChatMessage[] => {
  const storedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
  if (!storedMessages) {
      return createInitialMockData();
  }
  return JSON.parse(storedMessages);
};

const saveChatMessages = (messages: CommonChatMessage[]) => {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
};

export const addChatMessage = (
    messageData: Omit<TextMessage, 'id' | 'timestamp'> | Omit<ImageMessage, 'id' | 'timestamp'> | Omit<PollMessage, 'id' | 'timestamp'>
): CommonChatMessage => {
  const messages = getChatMessages();
  
  const newMessage: CommonChatMessage = {
    ...messageData,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  messages.push(newMessage);
  saveChatMessages(messages);
  return newMessage;
};

export const voteOnPoll = (messageId: string, optionIndex: number, userId: string): boolean => {
  const messages = getChatMessages();
  const messageIndex = messages.findIndex(msg => msg.id === messageId && msg.type === 'poll');
  
  if (messageIndex === -1) {
    console.error("Poll message not found");
    return false;
  }

  const pollMessage = messages[messageIndex] as PollMessage;
  const poll = pollMessage.poll;

  // Check if user has already voted on any option in this poll
  const hasVoted = poll.options.some(opt => opt.voters.includes(userId));

  if (hasVoted) {
      // Retract previous vote
      poll.options.forEach(opt => {
          const voterIndex = opt.voters.indexOf(userId);
          if (voterIndex > -1) {
              opt.voters.splice(voterIndex, 1);
          }
      });
  }

  // Add new vote
  if (poll.options[optionIndex]) {
    poll.options[optionIndex].voters.push(userId);
  } else {
    console.error("Invalid option index");
    return false;
  }

  // Update the message in the array
  messages[messageIndex] = { ...pollMessage, poll: poll };
  saveChatMessages(messages);
  return true;
};