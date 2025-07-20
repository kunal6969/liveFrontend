import { api } from './api';

interface TotalUsersResponse {
    totalUsers: number;
}

/**
 * Fetches the total number of registered users from the backend.
 * @returns A promise that resolves to an object containing the total user count.
 */
export const getTotalUsers = async (): Promise<TotalUsersResponse> => {
    // Corrected endpoint to match the backend's user route
    return api.get<TotalUsersResponse>('/user/stats');
};
