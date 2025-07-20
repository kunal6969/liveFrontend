

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MatchRequest, RoomListing, User, RoomLocation } from '../types';
import { MOCK_ROOM_LISTINGS, MOCK_USERS_DB } from '../constants';
import { getMessagesForUser } from '../services/messagingService'; // Assuming this is needed for something
import RequestCard from '../components/RequestCard';
import LoadingIndicator from '../components/LoadingIndicator';
import SendMessageModal from '../components/SendMessageModal';
import { Modal, Button } from '../components/UIElements';
import { ClipboardDocumentListIcon, HandshakeIcon, EnvelopeIcon, CheckmarkIcon, QuestionIcon, RocketIcon } from '../components/VibrantIcons';
import { initializeUserDb, swapUserRooms } from '../services/friendService';


const SummaryCard: React.FC<{ title: string; count: number; icon: React.ReactNode }> = ({ title, count, icon }) => (
    <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200/80 dark:border-white/10 flex items-center gap-4">
        <div className="w-12 h-12 flex-shrink-0">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
        </div>
    </div>
);

const RoomRequestsPage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [allRequests, setAllRequests] = useState<MatchRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
    const [listingsMap, setListingsMap] = useState<Map<string, RoomListing>>(new Map());
    const [usersMap, setUsersMap] = useState<Map<string, Pick<User, 'id'|'fullName'|'rollNumber'|'gender'>>>(new Map());

    // State for modals
    const [isCongratsModalOpen, setIsCongratsModalOpen] = useState(false);
    const [congratsMessage, setCongratsMessage] = useState('');
    const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
    const [messageModalData, setMessageModalData] = useState<{lister: {id: string, fullName: string}, listing: {id: string, roomDetails: RoomLocation, roomSummary: string}} | null>(null);

    // This mock data should be fetched from a service, but for now...
    const [mockRequests, setMockRequests] = useState<MatchRequest[]>([]);


    const loadData = useCallback(() => {
        setIsLoading(true);
        // Simulate fetching data
        setTimeout(() => {
            initializeUserDb(); // Ensure user DB in localStorage is ready
            // In a real app, this would be an API call. For the demo, we use a simple mock.
            const fetchedRequests: MatchRequest[] = [
                { id: 'req-1', listingId: '1', requesterId: 'user-amit.verma', status: 'Pending', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), approvals: [] },
                { id: 'req-2', listingId: '5', requesterId: 'user-rohan.sharma', status: 'Accepted', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), approvals: ['user-vikram.singh'] },
                { id: 'req-3', listingId: '4', requesterId: 'user-priya.mehta', status: 'Rejected', createdAt: new Date(Date.now() - 3600000 * 10).toISOString(), approvals: [] },
                { id: 'req-4', listingId: '2', requesterId: 'user-anjali.desai', status: 'Pending', createdAt: new Date(Date.now() - 3600000 * 1).toISOString(), approvals: [] },
            ];
            setMockRequests(fetchedRequests);
            setAllRequests(fetchedRequests);

            const lMap = new Map<string, RoomListing>();
            MOCK_ROOM_LISTINGS.forEach(l => lMap.set(l.id, l));
            setListingsMap(lMap);

            const uMap = new Map<string, Pick<User, 'id'|'fullName'|'rollNumber'|'gender'>>();
            MOCK_USERS_DB.forEach(u => uMap.set(u.id, {id: u.id, fullName: u.fullName, rollNumber: u.rollNumber, gender: u.gender}));
            if(user) { 
                uMap.set(user.id, {id: user.id, fullName: user.fullName, rollNumber: user.rollNumber, gender: user.gender});
            }
            setUsersMap(uMap);
            
            setIsLoading(false);
        }, 500);
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const { sentRequests, receivedRequests } = useMemo(() => {
        if (!user) return { sentRequests: [], receivedRequests: [] };
        const sent = allRequests
            .filter(r => r.requesterId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const myListingIds = MOCK_ROOM_LISTINGS.filter(l => l.listedBy.id === user.id).map(l => l.id);
        const received = allRequests
            .filter(r => myListingIds.includes(r.listingId))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { sentRequests: sent, receivedRequests: received };
    }, [allRequests, user]);

    const approvedCount = useMemo(() => {
        return allRequests.filter(r => r.status === 'Confirmed' && (r.requesterId === user?.id || listingsMap.get(r.listingId)?.listedBy.id === user?.id)).length;
    }, [allRequests, user, listingsMap]);

    const handleRequestStatusUpdate = useCallback((requestId: string, newStatus: 'Accepted' | 'Rejected' | 'Withdrawn') => {
        setAllRequests(prev => prev.map(req => {
            if (req.id === requestId) {
                return { ...req, status: newStatus as MatchRequest['status'] };
            }
            return req;
        }));
    }, []);
    
    const handleApproveDeal = async (requestId: string) => {
        if (!user) return;
        const requestIndex = allRequests.findIndex(r => r.id === requestId);
        if (requestIndex === -1) return;
    
        const updatedRequests = [...allRequests];
        const request = { ...updatedRequests[requestIndex] };
    
        // Add current user's approval if not already there
        if (!request.approvals.includes(user.id)) {
            request.approvals.push(user.id);
        }
    
        const listerId = listingsMap.get(request.listingId)?.listedBy.id;
    
        // Check for mutual approval
        if (listerId && request.approvals.includes(request.requesterId) && request.approvals.includes(listerId)) {
            request.status = 'Confirmed';
            
            // Perform the room swap
            const swappedUsers = await swapUserRooms(request.requesterId, listerId);
            
            if (swappedUsers) {
                // Trigger UI updates
                refreshUser();
                setCongratsMessage(`Congratulations! You have successfully exchanged rooms with ${user.id === swappedUsers.user1.id ? swappedUsers.user2.fullName : swappedUsers.user1.fullName}. Your new room is ${user.id === swappedUsers.user1.id ? swappedUsers.user1.currentRoom?.roomNumber : swappedUsers.user2.currentRoom?.roomNumber}.`);
                setIsCongratsModalOpen(true);
            }
        }
    
        updatedRequests[requestIndex] = request;
        setAllRequests(updatedRequests);
    };

    const handleOpenMessageModal = (partner: {id: string, fullName: string}, listing: {id: string, roomSummary: string}) => {
        if (!user) return;
        const listingDetails = listingsMap.get(listing.id);
        if(!listingDetails) return;

        setMessageModalData({ 
            lister: partner, // The person to message
            listing: { 
                id: listing.id, 
                roomDetails: listingDetails.roomDetails, 
                roomSummary: listing.roomSummary 
            }
        });
        setIsSendMessageModalOpen(true);
    };


    if (isLoading) return <LoadingIndicator message="Loading your requests..." />;
    if (!user) return <p>Please log in to see your requests.</p>;

    const renderRequestList = (requests: MatchRequest[], type: 'sent' | 'received') => {
        if (requests.length === 0) {
            return (
                <div className="text-center py-12">
                    <QuestionIcon className="mx-auto h-16 w-16" />
                    <h3 className="mt-4 text-xl font-medium text-slate-900 dark:text-white">No {type} requests found.</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {type === 'sent' ? 'You can send requests from the Search page.' : 'Requests from other students for your room will appear here.'}
                    </p>
                </div>
            );
        }
        return (
            <div className="space-y-4 p-1">
                {requests.map(req => {
                    const listingDetails = listingsMap.get(req.listingId);
                    const requesterDetails = usersMap.get(req.requesterId);
                    const listerDetails = listingDetails ? usersMap.get(listingDetails.listedBy.id) : undefined;
                    
                    if (!listingDetails || !requesterDetails || !listerDetails) return null;

                    return (
                        <RequestCard 
                            key={req.id}
                            request={req}
                            type={type}
                            currentUserId={user.id}
                            listingDetails={listingDetails}
                            requesterDetails={requesterDetails}
                            listerDetails={listerDetails}
                            onUpdateStatus={handleRequestStatusUpdate}
                            onApproveDeal={handleApproveDeal}
                            onMessage={handleOpenMessageModal}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
             {isCongratsModalOpen && (
                <Modal isOpen={isCongratsModalOpen} onClose={() => setIsCongratsModalOpen(false)} title="Deal Confirmed!">
                    <div className="text-center">
                        <RocketIcon className="w-16 h-16 mx-auto" />
                        <p className="mt-4 text-slate-700 dark:text-slate-300">{congratsMessage}</p>
                    </div>
                     <div className="mt-6 flex justify-end">
                        <Button onClick={() => setIsCongratsModalOpen(false)}>Close</Button>
                    </div>
                </Modal>
            )}
            {isSendMessageModalOpen && messageModalData && user && (
                <SendMessageModal
                    isOpen={isSendMessageModalOpen}
                    onClose={() => setIsSendMessageModalOpen(false)}
                    currentUser={user}
                    lister={messageModalData.lister}
                    listing={messageModalData.listing}
                />
            )}

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
                <ClipboardDocumentListIcon className="w-9 h-9" />
                Room Exchange Requests
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="Requests Received" count={receivedRequests.length} icon={<EnvelopeIcon />} />
                <SummaryCard title="Requests Sent" count={sentRequests.length} icon={<HandshakeIcon />} />
                <SummaryCard title="Approved Exchanges" count={approvedCount} icon={<CheckmarkIcon />} />
            </div>

            <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-white/10">
                <div className="flex border-b border-slate-200/90 dark:border-white/10 p-2">
                    <button onClick={() => setActiveTab('received')} className={`flex-1 p-3 font-semibold rounded-md transition-colors ${activeTab === 'received' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-black/20'}`}>
                        Received ({receivedRequests.length})
                    </button>
                    <button onClick={() => setActiveTab('sent')} className={`flex-1 p-3 font-semibold rounded-md transition-colors ${activeTab === 'sent' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-black/20'}`}>
                        Sent ({sentRequests.length})
                    </button>
                </div>
                <div className="p-2 sm:p-6">
                    {activeTab === 'received' && renderRequestList(receivedRequests, 'received')}
                    {activeTab === 'sent' && renderRequestList(sentRequests, 'sent')}
                </div>
            </div>
        </div>
    );
};

export default RoomRequestsPage;
