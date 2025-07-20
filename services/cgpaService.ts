import { CgpaData } from '../types';
import { api } from './api';

export const getCgpaData = async (): Promise<CgpaData> => {
    try {
        const data = await api.get<CgpaData>('/cgpa');
        // Ensure there's always at least one semester card for the UI
        if (!data || !data.semesters || data.semesters.length === 0) {
            return { semesters: [{ id: `sem-new`, sgpa: '', credits: '' }] };
        }
        return data;
    } catch (error) {
        console.error("Failed to get CGPA data, returning default.", error);
        // Default data if the call fails (e.g., 404 for a new user)
        return {
            semesters: [{ id: `sem-new`, sgpa: '', credits: '' }],
        };
    }
};

export const saveCgpaData = async (data: CgpaData): Promise<CgpaData> => {
    // Filter out empty semesters before saving
    const filteredData = {
        ...data,
        semesters: data.semesters.filter(sem => sem.sgpa.trim() !== '' && sem.credits.trim() !== ''),
    };
    return api.post<CgpaData>('/cgpa', filteredData);
};
