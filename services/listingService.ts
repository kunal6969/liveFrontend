import { RoomListing, RoomListingFormData, RoomLocation } from '../types';
import { api } from './api';

export const uploadAllotmentProof = async (file: File): Promise<{ allotmentProof: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('allotmentProof', file);

    // Use fetch directly for file upload instead of our JSON API wrapper
    const response = await fetch('https://server.mnit.live/api/listings/upload-proof', {
        method: 'POST',
        credentials: 'include', // Important for authentication
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload allotment proof');
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'Failed to upload allotment proof');
    }

    return result.data;
};

export const getListings = async (): Promise<RoomListing[]> => {
    return api.get<RoomListing[]>('/listings');
};

export const saveListing = async (formData: RoomListingFormData, existingListingId?: string): Promise<RoomListing> => {
    // The backend should handle parsing the room number and associating the logged-in user.
    // The frontend's responsibility is to send the raw form data.

    const roomNumberString = formData.roomDetails.roomNumber.trim();
    const parts = roomNumberString.split('-').map(p => p.trim());
    const block = parts.length > 1 ? parts[0].toUpperCase() : '';
    const number = parts.length > 1 ? parts.slice(1).join('-') : parts[0];

    const finalRoomDetails: RoomLocation = {
        hostel: formData.roomDetails.hostel,
        block: block,
        roomNumber: number,
        type: formData.roomDetails.type
    };

    const payload: Omit<RoomListingFormData, 'roomDetails'> & { roomDetails: RoomLocation } = {
        ...formData,
        roomDetails: finalRoomDetails
    };

    if (existingListingId) {
        return api.put<RoomListing>(`/listings/${existingListingId}`, payload);
    } else {
        return api.post<RoomListing>('/listings', payload);
    }
};

export const delistListing = async (listingId: string): Promise<void> => {
    // The backend will change the status to 'Closed'
    return api.delete<void>(`/listings/${listingId}`);
};
