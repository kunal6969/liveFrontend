
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Friend, FriendRequest } from '../types';
import * as friendService from '../services/friendService';
import { Button, Input, Spinner } from '../components/UIElements';
import LoadingIndicator from '../components/LoadingIndicator';
import { 
    SearchIcon, 
    UsersIcon, 
    UserPlusIcon, 
    UserMinusIcon, 
    MessageCircleIcon,
    CheckmarkIcon,
    RejectIcon,
    EnvelopeIcon
} from '../components/VibrantIcons';

const FindFriendsPage: React.FC = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<User | 'not_found' | null>(null);
    const [friendshipStatus, setFriendshipStatus] = useState<'friends' | 'request_sent' | 'request_received' | 'none'>('none');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const [userFriends, userRequests] = await Promise.all([
            friendService.getFriends(user.id),
            friendService.getFriendRequests(user.id)
        ]);
        setFriends(userFriends);
        setRequests(userRequests);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !user) return;
        setIsSearching(true);
        setSearchResult(null);
        const result = await friendService.searchUserByUsername(searchQuery, user.id);
        if (result) {
            setSearchResult(result);
            const status = await friendService.getFriendshipStatus(user.id, result.id);
            setFriendshipStatus(status);
        } else {
            setSearchResult('not_found');
        }
        setIsSearching(false);
    };
    
    const handleSendRequest = async (toUserId: string) => {
        if (!user) return;
        await friendService.sendFriendRequest(user.id, toUserId);
        setFriendshipStatus('request_sent');
    };

    const handleAcceptRequest = async (requestId: string) => {
        if (!user) return;
        await friendService.handleFriendRequest(user.id, requestId, 'accept');
        fetchData(); // Re-fetch all data
    };
    
    const handleRejectRequest = async (requestId: string) => {
        if (!user) return;
        await friendService.handleFriendRequest(user.id, requestId, 'reject');
        fetchData(); // Re-fetch all data
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!user) return;
        if (window.confirm(`Are you sure you want to remove ${friends.find(f => f.id === friendId)?.fullName} as a friend?`)) {
            await friendService.removeFriend(user.id, friendId);
            fetchData();
        }
    };

    if (isLoading) {
        return <LoadingIndicator message="Loading your friends..." />;
    }
    if (!user) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <main className="lg:col-span-2 space-y-8">
                {/* Search Panel */}
                <section className="bg-white/80 dark:bg-black/30 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20 dark:border-white/10">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                       <SearchIcon className="w-6 h-6" /> Find Students
                    </h2>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by MNIT username (e.g., 'priya.mehta')"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        />
                        <Button onClick={handleSearch} isLoading={isSearching}>Search</Button>
                    </div>
                    {isSearching ? <div className="mt-4"><Spinner size="sm"/></div> : searchResult && (
                        <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg animate-fade-in">
                           {searchResult === 'not_found' ? (
                                <p className="text-slate-600 dark:text-slate-400 text-center">User not registered.</p>
                           ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{searchResult.fullName}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {searchResult.currentRoom ? `${searchResult.currentRoom?.hostel} - ${searchResult.currentRoom?.block}/${searchResult.currentRoom?.roomNumber}` : 'Room not set'}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleSendRequest(searchResult.id)}
                                        disabled={friendshipStatus !== 'none'}
                                        leftIcon={friendshipStatus === 'none' ? <UserPlusIcon className="w-5 h-5"/> : <CheckmarkIcon className="w-5 h-5"/>}
                                    >
                                        {friendshipStatus === 'friends' && 'Friends'}
                                        {friendshipStatus === 'request_sent' && 'Request Sent'}
                                        {friendshipStatus === 'request_received' && 'Request Received'}
                                        {friendshipStatus === 'none' && 'Send Request'}
                                    </Button>
                                </div>
                           )}
                        </div>
                    )}
                </section>
                
                {/* Friends List */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <UsersIcon className="w-6 h-6"/> Your Friends ({friends.length})
                    </h2>
                    {friends.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {friends.map(friend => (
                               <div key={friend.id} className="bg-white/80 dark:bg-black/30 p-4 rounded-xl shadow-lg border border-white/20 dark:border-white/10 flex justify-between items-center transition-all hover:shadow-xl hover:scale-[1.02]">
                                   <div>
                                       <p className="font-semibold text-slate-800 dark:text-slate-200">{friend.fullName}</p>
                                       <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {friend.currentRoom ? `${friend.currentRoom?.hostel} - ${friend.currentRoom?.block}/${friend.currentRoom?.roomNumber}` : 'Room not set'}
                                       </p>
                                   </div>
                                   <div className="flex gap-2">
                                       <Button variant="ghost" size="sm" className="!p-2" title="Message"><MessageCircleIcon className="w-5 h-5"/></Button>
                                       <Button variant="ghost" size="sm" className="!p-2 !text-red-500 hover:!bg-red-500/10" title="Remove Friend" onClick={() => handleRemoveFriend(friend.id)}>
                                           <UserMinusIcon className="w-5 h-5"/>
                                       </Button>
                                   </div>
                               </div>
                           ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-white/80 dark:bg-black/30 rounded-xl">
                            <p className="text-slate-600 dark:text-slate-400">Your friends list is empty. Find some friends!</p>
                        </div>
                    )}
                </section>
            </main>

            {/* Right Sidebar - Friend Requests */}
            <aside className="lg:col-span-1 space-y-4">
                <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20 dark:border-white/10 sticky top-24">
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                       <EnvelopeIcon className="w-6 h-6"/> Pending Requests ({requests.length})
                    </h2>
                    {requests.length > 0 ? (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {requests.map(req => (
                                <div key={req.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg animate-fade-in">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{req.from.fullName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{req.from.rollNumber}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" variant="primary" onClick={() => handleAcceptRequest(req.id)}>Accept</Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleRejectRequest(req.id)}>Reject</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-4">
                            <p className="text-slate-600 dark:text-slate-400">No pending friend requests.</p>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default FindFriendsPage;
