
export interface User {
  id: string;
  email: string; // mnit.ac.in email
  fullName: string;
  rollNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  currentRoom: RoomLocation | null;
  preferences: ExchangePreferences;
  phoneNumber: string; 
  whatsappNumber: string; // Added for WhatsApp integration
  hasActiveListing?: boolean; 
  friends?: string[]; // list of user ids
}

export interface RoomLocation {
  hostel: string;
  block: string;
  roomNumber: string;
  type: RoomType;
}

export type RoomType = 'Single' | 'Double Shared' | 'Triple Shared' | 'Any';
export type ListingType = 'Exchange' | 'Bidding';

export interface RoomListing {
  id: string;
  listedBy: Pick<User, 'id' | 'fullName' | 'rollNumber' | 'gender' | 'whatsappNumber'>; 
  roomDetails: RoomLocation;
  listingType: ListingType;
  description: string;
  desiredTradeConditions?: string; 
  status: 'Open' | 'Closed';
  createdAt: string; // ISO date string
  interestCount?: number; 
}

export interface RoomListingFormData {
    roomDetails: RoomLocation;
    listingType: ListingType;
    description: string;
    desiredTradeConditions?: string;
    roomProofFile?: File | null;
    allotmentProof?: string; // Base64 image data
    allotmentProofType?: 'gmail' | 'email' | 'document';
}

export interface ExchangePreferences {
  hostels: string[];
  blocks: string[];
  floor?: string; 
  roomType?: RoomType;
  notes?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>; 
  loginWithUserData: (user: User) => void;
  register: (email: string, password: string, fullName: string, gender: User['gender'], whatsappNumber: string) => Promise<void>;
  logout: () => void;
  updateUserRoom: (room: RoomLocation) => void;
  updateUserPreferences: (prefs: ExchangePreferences) => void;
  updateUserDetails: (details: Partial<Pick<User, 'fullName' | 'rollNumber' | 'phoneNumber' | 'whatsappNumber' | 'gender'>>) => void;
  setUserHasActiveListing: (status: boolean) => void;
  refreshUser: () => void;
}

export const isRoomListing = (item: any): item is RoomListing => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'status' in item &&
    'listingType' in item &&
    'roomDetails' in item &&
    'createdAt' in item &&
    'description' in item
  );
};

// Attendance Tracker Types
export interface Course {
  id: string;
  name: string;
  color: string;
  attendedDays: string[]; // Array of date strings 'YYYY-MM-DD'
  missedDays: string[]; // Array of date strings 'YYYY-MM-DD'
}

// CGPA Calculator Types
export interface Semester {
    id: string;
    sgpa: string;
    credits: string;
}

export interface CgpaData {
    semesters: Semester[];
}

// Gemini Service Types
export interface SuggestedRoom {
  id: string;
  hostel: string;
  block: string;
  roomNumber: string;
  type: RoomType;
  reasoning: string;
  listedBy: Pick<User, 'id' | 'fullName' | 'rollNumber' | 'gender'>;
}

export interface GeminiSuggestion {
  roomId: string;
  hostel: string;
  block: string;
  roomNumber: string;
  type: string;
  reasoning: string;
}

export interface GeminiSuggestionResponse {
  suggestions: GeminiSuggestion[];
}

// Messaging Service Types
export interface DirectMessage {
  id: string;
  listingId: string;
  listingRoomSummary: string; // e.g., "HL-1 A/101"
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  timestamp: string; // ISO date string
  isReadByReceiver: boolean;
}

// Common Chat Service Types
export interface ChatMessageSender {
    id: string;
    name: string;
}

export interface TextMessage {
    id: string;
    type: 'text';
    sender: ChatMessageSender;
    timestamp: string;
    content: string;
}
export interface ImageMessage {
    id: string;
    type: 'image';
    sender: ChatMessageSender;
    timestamp: string;
    imageUrl: string;
}

export interface PollOption {
    text: string;
    voters: string[]; // array of user IDs
}
export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
}
export interface PollMessage {
    id: string;
    type: 'poll';
    sender: ChatMessageSender;
    timestamp: string;
    poll: Poll;
}

export type CommonChatMessage = TextMessage | ImageMessage | PollMessage;


// Events Service Types
export interface Event {
  id: string;
  name: string;
  organizer: string;
  dateTime: string; // ISO date string
  location: string;
  description: string;
  registrationLink?: string;
  registeredUsers: string[]; // Array of user IDs
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string; // User ID
}

export interface EventFormData {
    name: string;
    organizer: string;
    date: string;
    time: string;
    location: string;
    description: string;
    registrationLink?: string;
}

// Room Requests and Friends
export interface MatchRequest {
  id: string;
  listingId: string; // ID of the room listing being requested
  requesterId: string; // ID of the user making the request
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Confirmed';
  createdAt: string; // ISO date string
  approvals: string[]; // user IDs of those who approved
}

export interface Friend {
    id: string;
    fullName: string;
    rollNumber: string;
    gender: User['gender'];
    currentRoom: RoomLocation | null;
}

export interface FriendRequest {
    id: string;
    from: Pick<User, 'id' | 'fullName' | 'rollNumber' | 'gender'>;
    toUserId: string;
    createdAt: string; // ISO date string
}
