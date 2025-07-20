import { RoomListing, User, ExchangePreferences, RoomLocation, RoomType, FriendRequest, MatchRequest, Event } from './types';

export const MNIT_EMAIL_DOMAIN = 'mnit.ac.in';

export const ALL_HOSTELS: Array<{ value: string, label: string, gender: 'Male' | 'Female' }> = [
    // Boys
    { value: 'H1 - Parijat', label: 'H1 - Parijat', gender: 'Male' },
    { value: 'H2 - Chaitanya', label: 'H2 - Chaitanya', gender: 'Male' },
    { value: 'H3 - Satpura', label: 'H3 - Satpura', gender: 'Male' },
    { value: 'H4 - Lohit', label: 'H4 - Lohit', gender: 'Male' },
    { value: 'H5 - Brihaspati', label: 'H5 - Brihaspati', gender: 'Male' },
    { value: 'H6 - Kabir', label: 'H6 - Kabir', gender: 'Male' },
    { value: 'H7 - Drona', label: 'H7 - Drona', gender: 'Male' },
    { value: 'H8 - Varun', label: 'H8 - Varun', gender: 'Male' },
    { value: 'H9 - Aurobindo', label: 'H9 - Aurobindo', gender: 'Male' },
    { value: 'H10 - PG Hostel', label: 'H10 - PG Hostel', gender: 'Male' },
    { value: 'H15 - Aravali', label: 'H15 - Aravali', gender: 'Male' },
    // Girls
    { value: 'H12 - Gargi', label: 'H12 - Gargi', gender: 'Female' },
    { value: 'H14 - Vinodini', label: 'H14 - Vinodini', gender: 'Female' },
];

export const BLOCKS = ['A', 'B', 'C', 'D'];
export const ROOM_TYPES: RoomType[] = ['Single', 'Double Shared', 'Triple Shared', 'Any'];
export const FLOORS = ['Ground', 'First', 'Second', 'Third', 'Any'];

export const MOCK_USER_CURRENT_ROOM: RoomLocation = {
  hostel: 'H1 - Parijat',
  block: BLOCKS[0],
  roomNumber: '101',
  type: 'Double Shared',
};

export const MOCK_USER_PREFERENCES: ExchangePreferences = {
  hostels: ['H2 - Chaitanya', 'H4 - Lohit'],
  blocks: ['B', 'C'],
  floor: 'First',
  roomType: 'Single',
  notes: 'Looking for a quieter room, preferably not road-facing.'
};

export const getHostelGender = (hostelName: string): 'Male' | 'Female' | 'Unknown' => {
  const hostel = ALL_HOSTELS.find(h => h.value === hostelName);
  return hostel ? hostel.gender : 'Unknown';
};

export const MOCK_USERS_DB: User[] = [
    {
        id: 'user-amit.verma',
        email: '2022ucs1001@mnit.ac.in',
        fullName: 'Amit Verma',
        rollNumber: '2022UCS1001',
        gender: 'Male',
        currentRoom: MOCK_USER_CURRENT_ROOM,
        preferences: MOCK_USER_PREFERENCES,
        phoneNumber: '+911234567890',
        whatsappNumber: '+911234567890',
        hasActiveListing: true,
        friends: ['user-priya.mehta', 'user-rohan.sharma'],
    },
    {
        id: 'user-priya.mehta',
        email: '2022uec1002@mnit.ac.in',
        fullName: 'Priya Mehta',
        rollNumber: '2022UEC1002',
        gender: 'Female',
        currentRoom: { hostel: 'H12 - Gargi', block: 'B', roomNumber: '201', type: 'Single' },
        preferences: { hostels: ['H14 - Vinodini'], blocks: ['A'], roomType: 'Single' },
        phoneNumber: '+912345678901',
        whatsappNumber: '+912345678901',
        hasActiveListing: true,
        friends: ['user-amit.verma'],
    },
    {
        id: 'user-rohan.sharma',
        email: '2021ucc1003@mnit.ac.in',
        fullName: 'Rohan Sharma',
        rollNumber: '2021UCC1003',
        gender: 'Male',
        currentRoom: { hostel: 'H2 - Chaitanya', block: 'C', roomNumber: '303', type: 'Double Shared' },
        preferences: { hostels: ['H1 - Parijat'], blocks: ['A', 'B'], roomType: 'Double Shared' },
        phoneNumber: '+913456789012',
        whatsappNumber: '+913456789012',
        hasActiveListing: false,
        friends: ['user-amit.verma', 'user-vikram.singh'],
    },
     {
        id: 'user-vikram.singh',
        email: '2021ume1004@mnit.ac.in',
        fullName: 'Vikram Singh',
        rollNumber: '2021UME1004',
        gender: 'Male',
        currentRoom: { hostel: 'H5 - Brihaspati', block: 'A', roomNumber: '110', type: 'Single' },
        preferences: { hostels: ['H6 - Kabir'], blocks: ['D'], roomType: 'Single' },
        phoneNumber: '+914567890123',
        whatsappNumber: '+914567890123',
        hasActiveListing: true,
        friends: ['user-rohan.sharma'],
    },
    {
        id: 'user-anjali.desai',
        email: '2023uch1005@mnit.ac.in',
        fullName: 'Anjali Desai',
        rollNumber: '2023UCH1005',
        gender: 'Female',
        currentRoom: { hostel: 'H14 - Vinodini', block: 'D', roomNumber: '007', type: 'Double Shared' },
        preferences: { hostels: ['H12 - Gargi'], blocks: ['B', 'C'], roomType: 'Double Shared' },
        phoneNumber: '+915678901234',
        whatsappNumber: '+915678901234',
        hasActiveListing: true,
        friends: [],
    }
];

export const MOCK_ROOM_LISTINGS: RoomListing[] = [
  {
    id: '1',
    listedBy: { id: 'user-amit.verma', fullName: 'Amit Verma', rollNumber: '2022UCS1001', gender: 'Male', whatsappNumber: '+911234567890' },
    roomDetails: { hostel: 'H1 - Parijat', block: 'A', roomNumber: '101', type: 'Double Shared' },
    listingType: 'Exchange',
    description: 'A cozy room on the first floor with a good view of the garden. Looking to swap for a single room.',
    desiredTradeConditions: 'Single room in H2, H4 or H5.',
    status: 'Open',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    interestCount: 5,
  },
  {
    id: '2',
    listedBy: { id: 'user-priya.mehta', fullName: 'Priya Mehta', rollNumber: '2022UEC1002', gender: 'Female', whatsappNumber: '+912345678901' },
    roomDetails: { hostel: 'H12 - Gargi', block: 'B', roomNumber: '201', type: 'Single' },
    listingType: 'Bidding',
    description: 'Premium single room in Gargi Hostel. Quiet and well-maintained. Open for bids or exchange with a similar room in Vinodini.',
    desiredTradeConditions: 'A single room in H14 - Vinodini, preferably on a higher floor.',
    status: 'Open',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    interestCount: 12,
  },
   {
    id: '3',
    listedBy: { id: 'user-rohan.sharma', fullName: 'Rohan Sharma', rollNumber: '2021UCC1003', gender: 'Male', whatsappNumber: '+913456789012' },
    roomDetails: { hostel: 'H2 - Chaitanya', block: 'C', roomNumber: '303', type: 'Double Shared' },
    listingType: 'Exchange',
    description: 'My room is on the top floor, very airy. Looking for an exchange within Chaitanya or Parijat.',
    status: 'Closed',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    interestCount: 3,
  },
  {
    id: '4',
    listedBy: { id: 'user-vikram.singh', fullName: 'Vikram Singh', rollNumber: '2021UME1004', gender: 'Male', whatsappNumber: '+914567890123' },
    roomDetails: { hostel: 'H5 - Brihaspati', block: 'A', roomNumber: '110', type: 'Single' },
    listingType: 'Bidding',
    description: 'Spacious single room available for bidding. Newly painted. Near the common room.',
    desiredTradeConditions: 'Any double shared room, willing to take money for the difference.',
    status: 'Open',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    interestCount: 8,
  },
    {
    id: '5',
    listedBy: { id: 'user-anjali.desai', fullName: 'Anjali Desai', rollNumber: '2023UCH1005', gender: 'Female', whatsappNumber: '+915678901234' },
    roomDetails: { hostel: 'H14 - Vinodini', block: 'D', roomNumber: '007', type: 'Double Shared' },
    listingType: 'Exchange',
    description: 'Ground floor room, good for those who dislike stairs. Want to exchange for any room on 1st or 2nd floor in Gargi.',
    desiredTradeConditions: 'Room on 1st or 2nd floor in H12 - Gargi',
    status: 'Open',
    createdAt: new Date().toISOString(),
    interestCount: 2,
  },
];


export const MOCK_FRIENDS_DATA: Record<string, string[]> = {
    'user-amit.verma': ['user-priya.mehta', 'user-rohan.sharma'],
    'user-priya.mehta': ['user-amit.verma'],
    'user-rohan.sharma': ['user-amit.verma', 'user-vikram.singh'],
    'user-vikram.singh': ['user-rohan.sharma'],
    'user-anjali.desai': [],
};

export const MOCK_FRIEND_REQUESTS_DATA: FriendRequest[] = [
    {
        id: 'fr-1',
        from: { id: 'user-vikram.singh', fullName: 'Vikram Singh', rollNumber: '2021UME1004', gender: 'Male' },
        toUserId: 'user-amit.verma',
        createdAt: new Date().toISOString(),
    },
];