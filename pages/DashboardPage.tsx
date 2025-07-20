import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, RoomLocation, RoomListing, RoomListingFormData, ListingType, RoomType } from '../types';
import { ALL_HOSTELS, ROOM_TYPES } from '../constants';
import * as listingService from '../services/listingService';
import * as statsService from '../services/statsService';
import { Button, Modal, Input, Select, Textarea, Alert, UserCircleIcon } from '../components/UIElements';
import { HomeIcon, PencilIcon, RocketIcon, TrashIcon, WhatsAppIcon, UsersIcon, LoginIcon } from '../components/VibrantIcons';
import LoadingIndicator from '../components/LoadingIndicator';
import { Link } from 'react-router-dom';

const InfoCard: React.FC<{title: string, children: React.ReactNode, className?: string, titleIcon?: React.ReactNode}> = ({ title, children, className, titleIcon }) => (
  <div className={`holo-card p-6 ${className}`}>
    <h3 className="text-xl font-semibold text-cyan-300 mb-4 border-b border-cyan-500/20 pb-3 flex items-center gap-x-2">
      {titleIcon && <span className="w-7 h-7">{titleIcon}</span>}
      {title}
    </h3>
    {children}
  </div>
);

const UserProfileCard: React.FC<{ user: User, onEdit: () => void }> = ({ user, onEdit }) => {
  return (
    <InfoCard title="Your Profile" titleIcon={<UserCircleIcon />}>
        <div className="space-y-1 text-slate-300">
            <p><span className="font-medium text-slate-400">Name:</span> {user.fullName}</p>
            <p><span className="font-medium text-slate-400">Roll No:</span> {user.rollNumber}</p>
            <p><span className="font-medium text-slate-400">Email:</span> {user.email}</p>
            <p><span className="font-medium text-slate-400">WhatsApp:</span> {user.whatsappNumber || 'Not Set'}</p>
        </div>
         <Button 
            variant="ghost"
            size="sm"
            className="w-full mt-4 text-cyan-300 hover:bg-cyan-500/10"
            onClick={onEdit}
            leftIcon={<PencilIcon />}
          >
            Edit Profile
        </Button>
    </InfoCard>
  );
};

const ListEditRoomModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (data: RoomListingFormData, whatsappNumber: string) => void;
  existingListing?: RoomListing | null;
}> = ({ isOpen, onClose, user, onSave, existingListing }) => {
    const [formData, setFormData] = useState<RoomListingFormData>({
        roomDetails: existingListing?.roomDetails || user.currentRoom || { hostel: '', block: 'A', roomNumber: '', type: 'Single' },
        listingType: existingListing?.listingType || 'Exchange',
        description: existingListing?.description || '',
        desiredTradeConditions: existingListing?.desiredTradeConditions || '',
    });
    const [whatsappNumber, setWhatsappNumber] = useState(user.whatsappNumber || '');
    const [error, setError] = useState('');

    const availableHostels = useMemo(() => {
        if (!user.gender || user.gender === 'Other') return ALL_HOSTELS;
        return ALL_HOSTELS.filter(h => h.gender === user.gender);
    }, [user.gender]);

    useEffect(() => {
        if (isOpen) {
            const listingData = existingListing;
            
            const existingRoomDetails = listingData?.roomDetails || user.currentRoom;
            let combinedRoomNumber = '';
            if (existingRoomDetails) {
                combinedRoomNumber = existingRoomDetails.block ? `${existingRoomDetails.block}-${existingRoomDetails.roomNumber}` : existingRoomDetails.roomNumber;
            }

            setFormData({
                roomDetails: {
                    hostel: existingRoomDetails?.hostel || availableHostels[0]?.value || '',
                    block: existingRoomDetails?.block || 'A',
                    roomNumber: combinedRoomNumber,
                    type: existingRoomDetails?.type || 'Single',
                },
                listingType: listingData?.listingType || 'Exchange',
                description: listingData?.description || '',
                desiredTradeConditions: listingData?.desiredTradeConditions || '',
            });
            setWhatsappNumber(user.whatsappNumber || '');
            setError('');
        }
    }, [isOpen, user, existingListing, availableHostels]);

    const handleInputChange = (field: keyof Omit<RoomLocation, 'block'>, value: string | RoomType) => {
        setFormData(prev => ({ ...prev, roomDetails: { ...prev.roomDetails, [field]: value } }));
    };

    const handleFormChange = (field: keyof Omit<RoomListingFormData, 'roomDetails'>, value: string | ListingType) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        setError('');
        if (!formData.roomDetails.hostel || !formData.roomDetails.roomNumber.trim() || !formData.description.trim()) {
            setError('Hostel, Full Room Number, and Description are required.');
            return;
        }
        if (!/^\d{10}$/.test(whatsappNumber)) {
            setError('Please enter a valid 10-digit WhatsApp number (e.g., 9876543210).');
            return;
        }
        onSave(formData, whatsappNumber);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingListing ? 'Edit Your Listing' : 'List Your Room'} size="lg">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                
                <div className="p-3 bg-yellow-900/30 border border-yellow-400/50 rounded-lg">
                    <Input
                        id="whatsappNumber" name="whatsappNumber" type="tel" autoComplete="tel" required
                        placeholder="9876543210" value={whatsappNumber} 
                        onChange={(e) => {
                          // Only allow digits and limit to 10 characters
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setWhatsappNumber(value);
                        }}
                        label="WhatsApp Number for Contact (10 digits only)" icon={<WhatsAppIcon />}
                        className="futuristic-input"
                        maxLength={10}
                    />
                    <p className="mt-1 text-xs text-yellow-300 font-semibold">Very important, will be used for contacting you.</p>
                </div>

                <h3 className="text-lg font-semibold pt-2 text-cyan-300">Room Details</h3>
                <Select label="Hostel" value={formData.roomDetails.hostel} onChange={(value) => handleInputChange('hostel', value)} options={availableHostels} required className="futuristic-select" />
                <div>
                    <Input 
                        label="Full Room Number (incl. Block)" 
                        type="text" 
                        value={formData.roomDetails.roomNumber} 
                        onChange={(e) => handleInputChange('roomNumber', e.target.value)} 
                        placeholder="e.g., A-101, G-05" 
                        required 
                        className="futuristic-input"
                    />
                    <p className="text-xs mt-1 text-slate-400">Please provide the full room number, including the block prefix.</p>
                </div>
                <Select label="Room Type" value={formData.roomDetails.type} onChange={(value) => handleInputChange('type', value as RoomType)} options={ROOM_TYPES.filter(rt => rt !== 'Any').map(rt => ({ value: rt, label: rt }))} required className="futuristic-select"/>
                
                <h3 className="text-lg font-semibold pt-2 text-cyan-300">Listing Details</h3>
                <Select label="Listing Type" value={formData.listingType} onChange={(value) => handleFormChange('listingType', value as ListingType)} options={[{ value: 'Exchange', label: 'Up for Exchange' }, { value: 'Bidding', label: 'Up for Bidding' }]} required className="futuristic-select"/>
                <Textarea label="Description" rows={3} value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} placeholder="e.g., Well-ventilated, good view..." required className="futuristic-input"/>
                <Textarea label="Desired Trade Conditions (Optional)" rows={2} value={formData.desiredTradeConditions} onChange={(e) => handleFormChange('desiredTradeConditions', e.target.value)} placeholder="e.g., Looking for a single room in H1 - Parijat..." className="futuristic-input"/>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit}>Save Listing</Button>
            </div>
        </Modal>
    );
};

const AnimatedCounter: React.FC<{ end: number, duration?: number }> = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const startTime = Date.now();

        const animate = () => {
            const currentTime = Date.now();
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const currentCount = Math.floor(progress * end);
            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <>{count}</>;
};

const DashboardPage: React.FC = () => {
    const { user, loading, updateUserRoom, updateUserDetails, refreshUser } = useAuth();
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isDelistModalOpen, setIsDelistModalOpen] = useState(false);
    const [userListing, setUserListing] = useState<RoomListing | null>(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsDataLoading(true);
        try {
            const [listings, stats] = await Promise.all([
                user ? listingService.getListings() : Promise.resolve([]),
                statsService.getTotalUsers(),
            ]);
            if(user) {
                const foundListing = listings.find(l => l.listedBy.id === user.id && l.status === 'Open');
                setUserListing(foundListing || null);
            }
            setTotalUsers(stats.totalUsers);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsDataLoading(false);
        }
    }, [user]);
    
    useEffect(() => {
        document.body.classList.add('futuristic-theme');
        fetchData();
        return () => document.body.classList.remove('futuristic-theme');
    }, [fetchData]);

    const handleSaveListing = async (data: RoomListingFormData, whatsappNumber: string) => {
        if (!user) return;
        
        // Optimistically update whatsapp number, or wait for refreshUser
        if (user.whatsappNumber !== whatsappNumber) {
            await updateUserDetails({ whatsappNumber });
        }
        
        await listingService.saveListing(data, userListing?.id);

        await refreshUser(); // Refresh user state from backend
        await fetchData(); // Re-fetch listings to update UI
    };

    const openDelistConfirmation = () => {
        if (userListing) {
            setIsDelistModalOpen(true);
        }
    };
    
    const handleConfirmDelist = async () => {
        if (!user || !userListing) return;
        
        await listingService.delistListing(userListing.id);
        
        setIsDelistModalOpen(false);
        await refreshUser();
        await fetchData(); // Re-fetch to update UI
    };

    if (loading || isDataLoading) return <LoadingIndicator message="Initializing Dashboard..." />;

    return (
        <div className="space-y-8">
            <div className="holo-card flex flex-col sm:flex-row justify-between items-start gap-4 p-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {user ? `Welcome back, ${user.fullName.split(' ')[0]}!` : "Welcome to MNIT LIVE!"} 
                    </h1>
                    <p className="futuristic-text-secondary mt-1">
                        {user ? "This is your personal dashboard." : "The unofficial platform for hostel room exchange at MNIT."}
                    </p>
                </div>
            </div>

            {user && <ListEditRoomModal 
                isOpen={isListModalOpen} 
                onClose={() => setIsListModalOpen(false)} 
                user={user} 
                onSave={handleSaveListing}
                existingListing={userListing}
            />}

            <Modal 
                isOpen={isDelistModalOpen}
                onClose={() => setIsDelistModalOpen(false)}
                title={<div className="flex items-center gap-2 text-red-500"><TrashIcon className="w-7 h-7" /><span>Confirm Delist</span></div>}
                size="md"
            >
                <p>Are you sure you want to delist your room? This action will remove it from public view.</p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsDelistModalOpen(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleConfirmDelist}>Yes, Delist Room</Button>
                </div>
            </Modal>

            <div className={`grid ${user ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-8`}>
                 <InfoCard title="Community Members" titleIcon={<UsersIcon />} className={user ? 'md:col-span-1' : ''}>
                    <div className="text-center">
                        <p className="text-6xl font-black text-glow-white">
                            <AnimatedCounter end={totalUsers} />
                        </p>
                        <p className="futuristic-text-secondary mt-1">Registered students on the platform.</p>
                    </div>
                 </InfoCard>

                {user ? (
                    <>
                        <UserProfileCard user={user} onEdit={() => alert("Profile editing can be managed via the 'List/Edit Room' modal by updating your WhatsApp number.")} />
                        
                        <InfoCard title="Your Room Listing" titleIcon={<HomeIcon />}>
                            {user.hasActiveListing && userListing ? (
                                <div className="space-y-3 text-slate-300">
                                     <p><span className="font-medium text-slate-400">Hostel:</span> {userListing.roomDetails.hostel}</p>
                                     <p><span className="font-medium text-slate-400">Room:</span> {userListing.roomDetails.block ? `${userListing.roomDetails.block} / ${userListing.roomDetails.roomNumber}` : userListing.roomDetails.roomNumber}</p>
                                     <p><span className="font-medium text-slate-400">Type:</span> {userListing.roomDetails.type}</p>
                                     <div className="flex gap-2 pt-4">
                                        <Button variant="secondary" onClick={() => setIsListModalOpen(true)} leftIcon={<PencilIcon />}>Edit Listing</Button>
                                        <Button variant="danger" onClick={openDelistConfirmation} leftIcon={<TrashIcon />}>Delist</Button>
                                     </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-slate-400 mb-4">You have no active room listing.</p>
                                    <Button variant="primary" size="lg" onClick={() => setIsListModalOpen(true)} leftIcon={<RocketIcon />}>List Your Room Now</Button>
                                </div>
                            )}
                        </InfoCard>
                    </>
                ) : (
                    <div className="holo-card p-8 text-center md:col-span-2">
                        <h2 className="text-2xl font-bold text-cyan-300">Get Started</h2>
                        <p className="mt-2 text-slate-300">Log in to list your room, view your profile, and connect with other students.</p>
                        <Link to="/login">
                            <Button variant="primary" size="lg" className="mt-6" leftIcon={<LoginIcon />}>
                                Login to Your Account
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
