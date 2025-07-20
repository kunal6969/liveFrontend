

import React, { useState, useMemo, useEffect } from 'react';
import { RoomListing, ListingType, RoomType, User, RoomLocation } from '../types'; // Added User, RoomLocation
import { MOCK_ROOM_LISTINGS, ALL_HOSTELS, BLOCKS, ROOM_TYPES, getHostelGender } from '../constants';
import RoomCard from '../components/RoomCard';
import { Input, Select, Button, Alert } from '../components/UIElements'; // Added Alert
import { useAuth } from '../contexts/AuthContext';
import LoadingIndicator from '../components/LoadingIndicator';
import { SearchIcon as VibrantSearchIcon, QuestionIcon, HandshakeIcon } from '../components/VibrantIcons';


const SearchPage: React.FC = () => {
  const { user } = useAuth(); 
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<{
    hostel: string;
    block: string;
    listingType: ListingType | '';
    roomType: RoomType | '';
  }>({
    hostel: '',
    block: '',
    listingType: '',
    roomType: '',
  });

  const [displayListings, setDisplayListings] = useState<RoomListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInterests, setUserInterests] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string>(''); // For errors on actions like bidding

  useEffect(() => {
    setIsLoading(true);
    let relevantListings = MOCK_ROOM_LISTINGS;
    if (user?.gender === 'Male' || user?.gender === 'Female') {
      relevantListings = MOCK_ROOM_LISTINGS.filter(listing => {
        const hostelGender = getHostelGender(listing.roomDetails.hostel);
        const listingUserGender = listing.listedBy.gender;
         // Allow if hostel gender matches user gender OR if hostel gender is unknown and lister gender matches user gender
        return (hostelGender === user.gender) || (hostelGender === 'Unknown' && listingUserGender === user.gender);
      });
    }
    
    setDisplayListings(relevantListings);
    setTimeout(() => setIsLoading(false), 300); 
  }, [user]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setActionError(''); // Clear error on filter change
  };
  
  const handleExpressInterest = (listingId: string, currentInterestStatus: boolean) => {
    setActionError(''); // Clear previous errors
    if (!user) {
      setActionError("You must be logged in to express interest.");
      return;
    }

    const targetListing = displayListings.find(l => l.id === listingId);
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
    } else if (user.gender === 'Other') { // Or any other logic for 'Other' gender if needed
        isCompatible = true; // Or false, depending on rules for 'Other'
    }


    if (!isCompatible) {
      setActionError(`You cannot express interest in this room due to gender restrictions. (Your gender: ${user.gender}, Hostel/Lister policy).`);
      console.warn(`Attempted to bid on incompatible listing: User ${user.id} (${user.gender}) on Listing ${listingId} (Hostel: ${listingHostelGender}, Lister: ${listingOwnerGender})`);
      return;
    }

    setDisplayListings(prevListings =>
      prevListings.map(listing => {
        if (listing.id === listingId) {
          const newInterestCount = currentInterestStatus 
            ? (listing.interestCount || 0) - 1 
            : (listing.interestCount || 0) + 1;
          return { ...listing, interestCount: Math.max(0, newInterestCount) };
        }
        return listing;
      })
    );
    setUserInterests(prev => ({...prev, [listingId]: !currentInterestStatus}));
  };

  const filteredListings = useMemo(() => {
    return displayListings.filter(listing => {
      if (user && listing.listedBy.id === user.id) return false; 
      if (listing.status !== 'Open') return false; 

      // This primary display filtering should already ensure compatibility. The check in handleExpressInterest is a safeguard.
      if (user?.gender === 'Male' || user?.gender === 'Female') {
        const hostelGender = getHostelGender(listing.roomDetails.hostel);
        const listingUserGender = listing.listedBy.gender;
        if (!((hostelGender === user.gender) || (hostelGender === 'Unknown' && listingUserGender === user.gender))) {
            return false;
        }
      }

      const matchesHostel = filters.hostel ? listing.roomDetails.hostel === filters.hostel : true;
      const matchesBlock = filters.block ? listing.roomDetails.block === filters.block : true;
      const matchesListingType = filters.listingType ? listing.listingType === filters.listingType : true;
      const matchesRoomType = filters.roomType ? listing.roomDetails.type === filters.roomType : true;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearchTerm = searchTerm ? (
        listing.roomDetails.hostel.toLowerCase().includes(searchLower) ||
        listing.roomDetails.block.toLowerCase().includes(searchLower) ||
        listing.roomDetails.roomNumber.toLowerCase().includes(searchLower) ||
        listing.description.toLowerCase().includes(searchLower) ||
        (listing.desiredTradeConditions && listing.desiredTradeConditions.toLowerCase().includes(searchLower)) ||
        listing.listedBy.fullName.toLowerCase().includes(searchLower) ||
        listing.listedBy.rollNumber.toLowerCase().includes(searchLower)
      ) : true;

      return matchesHostel && matchesBlock && matchesListingType && matchesRoomType && matchesSearchTerm;
    });
  }, [displayListings, filters, searchTerm, user]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ hostel: '', block: '', listingType: '', roomType: '' });
    setActionError('');
  };
  
  const availableHostelOptions = useMemo(() => {
    const baseOptions = [{ value: '', label: 'All Hostels' }];
    if (!user || (user.gender !== 'Male' && user.gender !== 'Female')) { // If user gender is 'Other' or not set, show all
        return [...baseOptions, ...ALL_HOSTELS.map(h => ({ value: h.value, label: h.label }))]
    }
    // Filter hostels based on user's gender or if hostel gender is 'Unknown'
    const genderFilteredHostels = ALL_HOSTELS.filter(h => {
        const hostelG = getHostelGender(h.value);
        return hostelG === user.gender || hostelG === 'Unknown';
    });
    return [...baseOptions, ...genderFilteredHostels.map(h => ({ value: h.value, label: h.label }))];
  }, [user]);


  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center flex items-center justify-center gap-2">
        <VibrantSearchIcon className="w-8 h-8"/> Search Available Rooms
      </h1>
      <p className="text-center text-md text-slate-700 dark:text-slate-300 mb-6">Find your next hostel room at MNIT.</p>

      <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md p-6 rounded-xl shadow-lg mb-8 border border-white/20 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 items-end">
          <Input
            label="📝 Search by keyword"
            placeholder="e.g., HL-1, Single, Priya..."
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value); setActionError('');}}
            className="lg:col-span-1"
          />
          <Select
            label="🏢 Filter by Hostel"
            value={filters.hostel}
            onChange={(value) => handleFilterChange('hostel', value)}
            options={availableHostelOptions}
            disabled={availableHostelOptions.length <=1}
            placeholder={availableHostelOptions.length <=1 && user?.gender !== 'Other' ? "No hostels for your profile" : "All Hostels"}
          />
          <Select
            label="🚪 Filter by Block"
            value={filters.block}
            onChange={(value) => handleFilterChange('block', value)}
            options={[{ value: '', label: 'All Blocks' }, ...BLOCKS.map(b => ({ value: b, label: b }))]}
          />
          <Select
            label="🏷️ Filter by Listing Type"
            value={filters.listingType}
            onChange={(value) => handleFilterChange('listingType', value as ListingType | '')}
            options={[
              { value: '', label: 'All Types' },
              { value: 'Exchange', label: 'Exchange' },
              { value: 'Bidding', label: 'Bidding' }
            ]}
          />
          <Select
            label="🛌 Filter by Room Type"
            value={filters.roomType}
            onChange={(value) => handleFilterChange('roomType', value as RoomType | '')}
            options={[ {value: '', label: 'All Room Types'}, ...ROOM_TYPES.map(rt => ({ value: rt, label: rt }))]}
          />
          <Button onClick={resetFilters} variant="secondary" className="h-10 w-full md:w-auto">🔄 Reset Filters</Button>
        </div>
      </div>

      {actionError && <Alert type="error" message={actionError} onClose={() => setActionError('')} className="mb-4" />}
 
      {isLoading ? (
        <LoadingIndicator message="Loading listings..." />
      ) : filteredListings.length > 0 ? ( 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filteredListings.map((listing, index) => (
            <RoomCard 
              key={listing.id} 
              room={listing} 
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
          <QuestionIcon className="mx-auto h-16 w-16" />
          <h3 className="mt-4 text-xl font-medium text-slate-900 dark:text-white">No Rooms Found</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Try adjusting your search or filter criteria. Listings are filtered based on your gender.</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
