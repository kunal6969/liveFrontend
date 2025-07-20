

import React, { useState, useMemo, useEffect } from 'react';
import { RoomListing, User, RoomLocation } from '../types'; // Added User, RoomLocation
import { MOCK_ROOM_LISTINGS, getHostelGender } from '../constants';
import RoomCard from '../components/RoomCard';
import { useAuth } from '../contexts/AuthContext';
import LoadingIndicator from '../components/LoadingIndicator';
import { Alert } from '../components/UIElements'; // Added Alert
import { FireIcon } from '../components/VibrantIcons';


const TrendingRoomsPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<RoomListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInterests, setUserInterests] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string>(''); // For errors on actions like bidding

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
        let relevantListings = MOCK_ROOM_LISTINGS.filter(
            listing => listing.listingType === 'Bidding' && 
                       listing.status === 'Open' &&
                       (!user || listing.listedBy.id !== user.id)
          );

        if (user?.gender === 'Male' || user?.gender === 'Female') {
            relevantListings = relevantListings.filter(listing => {
                const hostelGender = getHostelGender(listing.roomDetails.hostel);
                const listingUserGender = listing.listedBy.gender;
                 // Allow if hostel gender matches user gender OR if hostel gender is unknown and lister gender matches user gender
                return (hostelGender === user.gender) || (hostelGender === 'Unknown' && listingUserGender === user.gender);
            });
        }
        
        relevantListings.sort((a, b) => (b.interestCount || 0) - (a.interestCount || 0));
        setListings(relevantListings);
        setIsLoading(false);
    }, 500);
  }, [user]);

  const handleExpressInterest = (listingId: string, currentInterestStatus: boolean) => {
    setActionError(''); // Clear previous errors
    if (!user) {
      setActionError("You must be logged in to express interest.");
      return;
    }

    const targetListing = listings.find(l => l.id === listingId);
    if (!targetListing) {
      setActionError("Listing not found.");
      return;
    }
    
    // Gender compatibility check for bidding/expressing interest
    const listingHostelGender = getHostelGender(targetListing.roomDetails.hostel);
    const listingOwnerGender = targetListing.listedBy.gender;

    let isCompatible = false;
    if (user.gender === 'Male' || user.gender === 'Female') {
        if (listingHostelGender === user.gender) {
            isCompatible = true;
        } else if (listingHostelGender === 'Unknown' && listingOwnerGender === user.gender) {
            isCompatible = true;
        }
    } else if (user.gender === 'Other') {
        isCompatible = true; 
    }

    if (!isCompatible) {
      setActionError(`You cannot express interest in this room due to gender restrictions. (Your gender: ${user.gender}, Hostel/Lister policy).`);
      console.warn(`Attempted to bid on incompatible listing: User ${user.id} (${user.gender}) on Listing ${listingId} (Hostel: ${listingHostelGender}, Lister: ${listingOwnerGender})`);
      return;
    }

    setListings(prevListings =>
      prevListings.map(listing => {
        if (listing.id === listingId) {
          const newInterestCount = currentInterestStatus 
            ? (listing.interestCount || 0) - 1 
            : (listing.interestCount || 0) + 1;
          return { ...listing, interestCount: Math.max(0, newInterestCount) };
        }
        return listing;
      }).sort((a, b) => (b.interestCount || 0) - (a.interestCount || 0)) 
    );
    setUserInterests(prev => ({...prev, [listingId]: !currentInterestStatus}));
  };
  
  const trendingRooms = useMemo(() => {
    // This filtering is the primary defense. The check in handleExpressInterest is a safeguard.
    if (!user) return listings;
    if (user.gender !== 'Male' && user.gender !== 'Female') return listings; // 'Other' gender sees all for now on trending

    return listings.filter(listing => {
        const hostelGender = getHostelGender(listing.roomDetails.hostel);
        const listingUserGender = listing.listedBy.gender;
        return (hostelGender === user.gender) || (hostelGender === 'Unknown' && listingUserGender === user.gender);
    });
  }, [listings, user]);


  if (isLoading) {
    return <LoadingIndicator message="Fetching trending rooms..." />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-center gap-x-2">
            <FireIcon className="w-9 h-9" />
            Trending Rooms
        </h1>
        <p className="text-lg text-slate-700 dark:text-slate-300">Discover the most sought-after rooms based on student interest!</p>
      </div>

      {actionError && <Alert type="error" message={actionError} onClose={() => setActionError('')} className="mb-4" />}

      {trendingRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {trendingRooms.map((listing, index) => (
            <RoomCard
              key={listing.id}
              room={listing}
              rank={index + 1}
              currentUserId={user?.id}
              onExpressInterest={handleExpressInterest}
              currentUserInterested={!!userInterests[listing.id]}
              className="animate-pop-in"
              style={{ animationDelay: `${index * 80}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/80 dark:bg-black/30 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-white/10">
          <FireIcon className="mx-auto h-16 w-16 text-slate-400" />
          <h3 className="mt-4 text-xl font-medium text-slate-900 dark:text-white">No Trending Rooms Found</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">There are currently no rooms listed for bidding, or none have significant interest yet.</p> 
        </div>
      )}
    </div>
  );
};

export default TrendingRoomsPage;
