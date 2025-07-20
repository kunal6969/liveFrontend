import { Course } from '../types';
import { api } from './api'; // Use the existing authenticated API client

// Backend-compatible Course interface
interface BackendCourse {
    _id: string;
    name: string;
    color: string;
    userId: string;
    attendedDays: number;
    missedDays: number;
    attendanceHistory: Array<{
        date: string;
        present: boolean;
        _id: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

// Transform backend course to frontend course format
const transformCourse = (backendCourse: BackendCourse): Course => {
    // Safely handle attendanceHistory - it might be undefined or null
    const attendanceHistory = backendCourse.attendanceHistory || [];
    
    const attendedDays = attendanceHistory
        .filter(entry => entry && entry.present === true)
        .map(entry => entry.date)
        .filter(date => date); // Remove any undefined dates
    
    const missedDays = attendanceHistory
        .filter(entry => entry && entry.present === false)
        .map(entry => entry.date)
        .filter(date => date); // Remove any undefined dates

    return {
        id: backendCourse._id || `temp-${Date.now()}`,
        name: backendCourse.name || 'Unnamed Course',
        color: backendCourse.color || '#8B5CF6',
        attendedDays,
        missedDays
    };
};

// Utility function for retry logic
const retryRequest = async <T>(
    requestFn: () => Promise<T>, 
    maxRetries: number = 2,
    delay: number = 1000
): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error: any) {
            lastError = error;
            
            // Don't retry on client errors (4xx) or authentication errors
            if (error.statusCode >= 400 && error.statusCode < 500) {
                throw error;
            }
            
            // Only retry on server errors (5xx) or network errors
            if (attempt < maxRetries && (error.statusCode >= 500 || !error.statusCode)) {
                console.warn(`🔄 Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        }
    }
    
    throw lastError;
};

/**
 * Fetches all courses for the authenticated user
 */
export const getCourses = async (): Promise<Course[]> => {
    return retryRequest(async () => {
        console.log('🌐 API Call: GET /attendance/courses');
        const response = await api.get<BackendCourse[]>('/attendance/courses');
        
        // Validate that the response is an array
        if (!Array.isArray(response)) {
            console.error('❌ Expected array of courses, got:', typeof response, response);
            throw new Error('Invalid response format: expected array of courses');
        }
        
        // Filter out any invalid course objects before transformation
        const validBackendCourses = response.filter(course => {
            if (!course || typeof course !== 'object') {
                console.warn('⚠️ Filtering out invalid course (not object):', course);
                return false;
            }
            if (!course._id) {
                console.warn('⚠️ Filtering out course without _id:', course);
                return false;
            }
            if (!course.name) {
                console.warn('⚠️ Filtering out course without name:', course);
                return false;
            }
            return true;
        });
        
        if (validBackendCourses.length !== response.length) {
            console.warn(`⚠️ Filtered out ${response.length - validBackendCourses.length} invalid courses`);
        }
        
        // Transform each valid course from backend format to frontend format
        return validBackendCourses.map(transformCourse);
    });
};

/**
 * Creates a new course
 */
export const addCourse = async (name: string, color: string): Promise<Course> => {
    if (!name.trim()) {
        throw new Error('Course name cannot be empty');
    }
    
    return retryRequest(async () => {
        console.log('🌐 API Call: POST /attendance/courses', { name: name.trim(), color });
        const backendCourse = await api.post<BackendCourse>('/attendance/courses', { 
            name: name.trim(), 
            color 
        });
        
        return transformCourse(backendCourse);
    });
};

/**
 * Deletes a course by ID
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
    if (!courseId) {
        throw new Error('Course ID is required');
    }
    
    return retryRequest(async () => {
        console.log('🌐 API Call: DELETE /attendance/courses/' + courseId);
        await api.delete(`/attendance/courses/${courseId}`);
    });
};

/**
 * Marks attendance for a course on a specific date
 */
export const markAttendance = async (
    courseId: string, 
    dateString: string, 
    status: 'attended' | 'missed' | 'clear'
): Promise<Course> => {
    if (!courseId) {
        throw new Error('Course ID is required');
    }
    if (!dateString) {
        throw new Error('Date is required');
    }
    if (!['attended', 'missed', 'clear'].includes(status)) {
        throw new Error('Invalid attendance status');
    }
    
    return retryRequest(async () => {
        console.log('🌐 API Call: PATCH /attendance/courses/' + courseId + '/mark', { 
            date: dateString, 
            status: status
        });
        
        if (status === 'clear') {
            // For clear status, we might need to send a DELETE request to remove the attendance record
            // Or your backend might handle this in the PATCH endpoint
            // Let's try sending present: null or undefined to indicate removal
            console.log('🗑️ Clearing attendance for date:', dateString);
        }
        
        const requestBody: any = { date: dateString };
        
        if (status === 'attended') {
            requestBody.present = true;
        } else if (status === 'missed') {
            requestBody.present = false;
        }
        // For 'clear', we don't send present property, letting backend handle removal
        
        const backendCourse = await api.patch<BackendCourse>(`/attendance/courses/${courseId}/mark`, requestBody);
        
        return transformCourse(backendCourse);
    });
};

/**
 * Gets attendance statistics
 */
export const getStats = async (): Promise<any> => {
    return retryRequest(async () => {
        console.log('🌐 API Call: GET /attendance/stats');
        return api.get<any>('/attendance/stats');
    });
};

/**
 * Gets calendar data with optional filters
 */
export const getCalendarData = async (
    startDate?: string, 
    endDate?: string, 
    courseId?: string
): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (courseId) params.append('courseId', courseId);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/attendance/calendar?${queryString}` : '/attendance/calendar';
    
    return retryRequest(async () => {
        console.log('🌐 API Call: GET ' + endpoint);
        return api.get<any>(endpoint);
    });
};

/**
 * Gets week summary for attendance
 */
export const getWeekSummary = async (date?: string): Promise<any> => {
    const endpoint = date ? `/attendance/week-summary?date=${date}` : '/attendance/week-summary';
    
    return retryRequest(async () => {
        console.log('🌐 API Call: GET ' + endpoint);
        return api.get<any>(endpoint);
    });
};
