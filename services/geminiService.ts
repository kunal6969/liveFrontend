import { User, RoomListing, SuggestedRoom } from '../types';
import { api } from './api';

/**
 * Fetches AI-powered room suggestions from the backend.
 * The backend service is responsible for securely calling the Gemini API.
 * @param currentUser The user for whom to generate suggestions.
 * @param availableRooms The list of rooms to consider for suggestions.
 * @returns A promise that resolves to an array of suggested rooms.
 */
export const fetchRoomSuggestions = async (currentUser: User, availableRooms: RoomListing[]): Promise<SuggestedRoom[]> => {
  if (!currentUser.currentRoom) {
    console.warn("User's current room info missing. Cannot fetch suggestions.");
    return [];
  }

  try {
    // The front-end's role is to send the necessary context to our secure backend endpoint.
    const suggestions = await api.post<SuggestedRoom[]>('/suggestions', {
      currentUser,
      availableRooms,
    });
    return suggestions;
  } catch (error) {
    console.error("Error fetching room suggestions from the backend:", error);
    // Gracefully fail by returning an empty array so the UI doesn't crash.
    return [];
  }
};
