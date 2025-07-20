import { Event, EventFormData } from '../types';
import { api } from './api';

export const getEvents = async (): Promise<Event[]> => {
    return api.get<Event[]>('/events');
};

export const getUserRegistrations = async (): Promise<string[]> => {
    // Assuming the backend returns an array of event IDs the user is registered for
    return api.get<string[]>('/events/registrations');
};

export const registerForEvent = async (eventId: string): Promise<void> => {
    return api.post(`/events/${eventId}/register`);
};

export const unregisterFromEvent = async (eventId: string): Promise<void> => {
    return api.delete(`/events/${eventId}/register`);
};

export const requestEventListing = async (formData: EventFormData): Promise<Event> => {
    return api.post<Event>('/events/request', formData);
};
