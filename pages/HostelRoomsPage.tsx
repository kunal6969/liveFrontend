import React, { useState, useMemo, useEffect } from 'react';
import { RoomListing } from '../types';
import * as listingService from '../services/listingService';
import { ALL_HOSTELS } from '../constants';
import RoomCard from '../components/RoomCard';
import { useAuth } from '../contexts/AuthContext';
import LoadingIndicator from '../components/LoadingIndicator';
import { BuildingIcon, QuestionIcon } from '../components/VibrantIcons';


const HostelRoomsPage: React.FC = () => {
  const { user } = useAuth(); 
  const [listings, setListings] = useState<RoomListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    document.body.classList.add('futuristic-theme');
    return () => document.body.classList.remove('futuristic-theme');
  }, []);

  useEffect(() => {
    const fetchAndFilterListings = async () => {
        setIsLoading(true);
        try {
            const allListings = await listingService.getListings();

            // All filtering should ideally happen on the backend via query params,
            // but for this integration, we'll replicate the logic on the client.
            let relevantListings = allListings.filter(
                listing => listing.status === 'Open' && (!user || listing.listedBy.id !== user.id)
            );

            // Filter based on gender
            if (user?.gender === 'Male' || user?.gender === 'Female') {
                relevantListings = relevantListings.filter(listing => {
                    const hostelInfo = ALL_HOSTELS.find(h => h.value === listing.roomDetails.hostel);
                    const listingUserGender = listing.listedBy.gender;
                    // A room is relevant if its designated gender matches the user's,
                    // or if the lister's gender matches (for co-ed/unspecified hostels)
                    return hostelInfo?.gender === user.gender || listingUserGender === user.gender;
                });
            }
            
            setListings(relevantListings);
        } catch (error) {
            console.error("Failed to fetch listings:", error);
            // Optionally set an error state to show in the UI
        } finally {
            setIsLoading(false);
        }
    };
    fetchAndFilterListings();
  }, [user]);
  
  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2 text-center flex items-center justify-center gap-2 futuristic-title">
        <BuildingIcon className="w-8 h-8"/> Available Hostel Rooms
      </h1>
      <p className="text-center text-md text-slate-300 mb-6">Browse all rooms currently listed for exchange or bidding.</p>

      {isLoading ? (
        <LoadingIndicator message="Loading listings..." />
      ) : listings.length > 0 ? ( 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {listings.map((listing, index) => (
            <RoomCard 
              key={listing.id} 
              room={listing} 
              currentUserId={user?.id}
              className="animate-pop-in"
              style={{ animationDelay: `${index * 80}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 holo-card">
          <QuestionIcon className="mx-auto h-16 w-16" />
          <h3 className="mt-4 text-xl font-medium text-white">No Rooms Found</h3>
          <p className="mt-1 text-sm text-slate-400">There are currently no rooms listed, or none match your profile's gender restrictions.</p>
        </div>
      )}
    </div>
  );
};

export default HostelRoomsPage;
