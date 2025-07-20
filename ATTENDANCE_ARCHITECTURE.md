# Attendance Tracker - Client-Server Architecture

## Overview
The attendance tracker has been refactored to follow a proper client-server architecture where the frontend is responsible for **UI rendering** and **API communication** only, while all data management is handled by the backend server.

## Architecture Principles

### 1. Frontend Responsibilities
- ✅ **UI Rendering**: Display courses, calendars, and attendance data
- ✅ **User Interactions**: Handle clicks, form submissions, navigation
- ✅ **API Communication**: Make HTTP requests to backend
- ✅ **Optimistic Updates**: Immediately update UI for better UX
- ✅ **Error Handling**: Display appropriate error messages to users
- ❌ **Data Storage**: No localStorage or client-side data persistence
- ❌ **Business Logic**: No attendance calculation or validation logic

### 2. Backend Responsibilities (Expected)
- ✅ **Data Persistence**: Store courses and attendance records
- ✅ **Authentication**: Verify user identity
- ✅ **Authorization**: Ensure users can only access their own data
- ✅ **Business Logic**: Validate attendance rules and calculate statistics
- ✅ **API Endpoints**: Provide RESTful endpoints for frontend

## Key Implementation Features

### Service Layer (`/services/attendanceService.ts`)
- **Pure API Calls**: All functions make HTTP requests to backend
- **Retry Logic**: Automatic retry for server errors with exponential backoff
- **Input Validation**: Basic validation before sending requests
- **Error Handling**: Proper error propagation with detailed logging
- **Type Safety**: Full TypeScript support with proper return types

### Component Logic (`/pages/AttendanceTrackerPage.tsx`)
- **Optimistic Updates**: UI updates immediately, rollback on failure
- **State Management**: React state only for UI presentation
- **Error Recovery**: Graceful handling of API failures
- **Loading States**: Proper loading indicators during API calls
- **Authentication**: Automatic redirect handling for auth errors

## API Endpoints Used

### Courses Management
```
GET    /api/attendance/courses           - Get all user courses
POST   /api/attendance/courses           - Create new course
DELETE /api/attendance/courses/:id       - Delete course
```

### Attendance Management
```
POST   /api/attendance/courses/:id/mark  - Mark attendance
```

### Analytics (Future)
```
GET    /api/attendance/stats             - Get attendance statistics
GET    /api/attendance/calendar          - Get calendar data
GET    /api/attendance/week-summary      - Get week summary
```

## Error Handling Strategy

### HTTP Status Code Handling
- **401**: Authentication required - redirect to login
- **403**: Access denied - show permission error
- **404**: Resource not found - show appropriate message
- **409**: Conflict (duplicate course name) - show validation error
- **500+**: Server error - show retry option

### Optimistic Updates
1. **Immediate UI Update**: Change UI instantly for better UX
2. **API Request**: Send request to backend
3. **Success**: Keep optimistic update
4. **Failure**: Rollback to previous state + show error

### Retry Logic
- **Server Errors (5xx)**: Retry up to 2 times with exponential backoff
- **Network Errors**: Retry with backoff
- **Client Errors (4xx)**: No retry, immediate failure

## Data Flow

### Course Creation
1. User enters course name
2. **Optimistic**: Add temporary course to UI
3. **API**: POST to `/api/attendance/courses`
4. **Success**: Replace temp course with server response
5. **Failure**: Remove temp course, restore input, show error

### Attendance Marking
1. User clicks calendar day
2. **Optimistic**: Update attendance in UI immediately
3. **API**: POST to `/api/attendance/courses/:id/mark`
4. **Success**: Replace optimistic data with server response
5. **Failure**: Rollback to original state, show error

### Course Deletion
1. User confirms deletion
2. **Optimistic**: Remove course from UI
3. **API**: DELETE to `/api/attendance/courses/:id`
4. **Success**: Keep removal
5. **Failure**: Restore course, show error

## Benefits of This Architecture

### Performance
- **Instant UI Response**: Optimistic updates make app feel fast
- **Efficient Network Usage**: Only necessary API calls
- **Smart Retry**: Reduces failed requests due to temporary issues

### Reliability
- **Graceful Degradation**: App works even with poor network
- **Error Recovery**: User can retry failed operations
- **State Consistency**: UI always reflects server state eventually

### Maintainability
- **Clear Separation**: Frontend UI vs Backend Business Logic
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Testability**: Each layer can be tested independently

### User Experience
- **Fast Interactions**: No waiting for server on every click
- **Clear Error Messages**: User knows what went wrong and how to fix it
- **Smooth Transitions**: Loading states and animations

## Backend Integration Requirements

The frontend expects the backend to:

1. **Authenticate requests** using cookies/JWT
2. **Return consistent JSON format**: `{success: boolean, message: string, data: T}`
3. **Handle CORS** for `http://localhost:5173`
4. **Set proper HTTP status codes** for different error types
5. **Validate input** and return appropriate error messages
6. **Maintain data consistency** across concurrent requests

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Test component logic and state management
- **Integration Tests**: Test API service functions
- **E2E Tests**: Test complete user workflows
- **Error Scenario Tests**: Test error handling and recovery

### API Testing
- **Mock API Responses**: Test frontend with various backend responses
- **Network Failure Simulation**: Test retry logic and error handling
- **Authentication Testing**: Test auth error scenarios

This architecture ensures a robust, scalable, and maintainable attendance tracking system with excellent user experience and proper separation of concerns.
