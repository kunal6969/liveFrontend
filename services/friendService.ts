import { User, Friend, FriendRequest, RoomLocation } from '../types';
import { MOCK_USERS_DB, MOCK_FRIENDS_DATA, MOCK_FRIEND_REQUESTS_DATA } from '../constants';

// In-memory state for this mock service
let friendsData = { ...MOCK_FRIENDS_DATA };
let friendRequestsData = [...MOCK_FRIEND_REQUESTS_DATA];

// Simulate async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================================================================
// == FULL USER DATABASE MANAGEMENT (added here due to no-new-file constraint)
// ==================================================================
const ALL_USERS_DB_KEY = 'hostelDalaliAllUsers';

export const initializeUserDb = () => {
    if (!localStorage.getItem(ALL_USERS_DB_KEY)) {
        localStorage.setItem(ALL_USERS_DB_KEY, JSON.stringify(MOCK_USERS_DB));
    }
};

const getUsersDb = (): User[] => {
    initializeUserDb();
    return JSON.parse(localStorage.getItem(ALL_USERS_DB_KEY)!) as User[];
};

const saveUsersDb = (users: User[]) => {
    localStorage.setItem(ALL_USERS_DB_KEY, JSON.stringify(users));
};

export const swapUserRooms = async (userId1: string, userId2: string): Promise<{user1: User, user2: User} | null> => {
    await delay(500);
    const users = getUsersDb();
    const user1Index = users.findIndex(u => u.id === userId1);
    const user2Index = users.findIndex(u => u.id === userId2);

    if (user1Index === -1 || user2Index === -1) {
        console.error("One or both users not found for room swap.");
        return null;
    }

    const room1 = users[user1Index].currentRoom;
    const room2 = users[user2Index].currentRoom;

    // Swap rooms
    users[user1Index].currentRoom = room2;
    users[user2Index].currentRoom = room1;
    
    // Save updated user list back to localStorage
    saveUsersDb(users);
    
    // Also update the currently logged-in user's localStorage entry if they are one of the parties
    const storedAuthUser = localStorage.getItem('authUser');
    if(storedAuthUser) {
        const authUser = JSON.parse(storedAuthUser) as User;
        if (authUser.id === userId1) {
            authUser.currentRoom = room2;
            localStorage.setItem('authUser', JSON.stringify(authUser));
        } else if (authUser.id === userId2) {
            authUser.currentRoom = room1;
            localStorage.setItem('authUser', JSON.stringify(authUser));
        }
    }

    return { user1: users[user1Index], user2: users[user2Index] };
};


// ==================================================================
// == FRIEND-SPECIFIC FUNCTIONS
// ==================================================================

export const searchUserByUsername = async (username: string, currentUserId: string): Promise<User | null> => {
    await delay(300);
    const user = MOCK_USERS_DB.find(u => u.email.startsWith(username.toLowerCase()) && u.id !== currentUserId);
    return user || null;
};

export const getFriendshipStatus = async (
    currentUserId: string,
    targetUserId: string
): Promise<'friends' | 'request_sent' | 'request_received' | 'none'> => {
    await delay(100);
    if (friendsData[currentUserId]?.includes(targetUserId)) {
        return 'friends';
    }
    if (friendRequestsData.some(req => req.from.id === currentUserId && req.toUserId === targetUserId)) {
        return 'request_sent';
    }
    if (friendRequestsData.some(req => req.from.id === targetUserId && req.toUserId === currentUserId)) {
        return 'request_received';
    }
    return 'none';
};

export const getFriends = async (userId: string): Promise<Friend[]> => {
    await delay(200);
    const friendIds = friendsData[userId] || [];
    return MOCK_USERS_DB.filter(user => friendIds.includes(user.id))
                       .map(user => ({
                           id: user.id,
                           fullName: user.fullName,
                           rollNumber: user.rollNumber,
                           gender: user.gender,
                           currentRoom: user.currentRoom
                       }));
};

export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
    await delay(200);
    return friendRequestsData.filter(req => req.toUserId === userId);
};

export const sendFriendRequest = async (fromUserId: string, toUserId: string): Promise<void> => {
    await delay(500);
    const alreadyExists = friendRequestsData.some(req => 
        (req.from.id === fromUserId && req.toUserId === toUserId) ||
        (req.from.id === toUserId && req.toUserId === fromUserId)
    );
    const areAlreadyFriends = friendsData[fromUserId]?.includes(toUserId);

    if (alreadyExists || areAlreadyFriends) {
        console.warn("Friend request already exists or they are already friends.");
        return;
    }

    const fromUser = MOCK_USERS_DB.find(u => u.id === fromUserId);
    if (!fromUser) throw new Error("Sender not found");

    const newRequest: FriendRequest = {
        id: `fr-${Date.now()}`,
        from: { id: fromUser.id, fullName: fromUser.fullName, rollNumber: fromUser.rollNumber, gender: fromUser.gender },
        toUserId: toUserId,
        createdAt: new Date().toISOString()
    };
    friendRequestsData.push(newRequest);
};

export const handleFriendRequest = async (currentUserId: string, requestId: string, action: 'accept' | 'reject'): Promise<void> => {
    await delay(500);
    const requestIndex = friendRequestsData.findIndex(req => req.id === requestId && req.toUserId === currentUserId);
    if (requestIndex === -1) {
        throw new Error("Request not found or you are not the recipient.");
    }
    
    const request = friendRequestsData[requestIndex];

    if (action === 'accept') {
        // Add to friends list for both users
        if (!friendsData[currentUserId]) friendsData[currentUserId] = [];
        friendsData[currentUserId].push(request.from.id);

        if (!friendsData[request.from.id]) friendsData[request.from.id] = [];
        friendsData[request.from.id].push(currentUserId);
    }
    
    // Remove the request from the list
    friendRequestsData.splice(requestIndex, 1);
};


export const removeFriend = async (userId: string, friendIdToRemove: string): Promise<void> => {
    await delay(500);
    if (friendsData[userId]) {
        friendsData[userId] = friendsData[userId].filter(id => id !== friendIdToRemove);
    }
    if (friendsData[friendIdToRemove]) {
        friendsData[friendIdToRemove] = friendsData[friendIdToRemove].filter(id => id !== friendIdToRemove);
    }
};