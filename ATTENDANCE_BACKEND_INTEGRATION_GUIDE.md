# 📚 Attendance Tracker Backend Integration Guide

## ✅ Current Frontend Status

The MNIT Live frontend is **already configured** to work with your backend! Here's what's already implemented:

### 🔧 1. API Configuration (Already Done)
The `services/api.ts` file is properly configured:
- ✅ Base URL: `http://localhost:5001/api`
- ✅ `credentials: 'include'` for cookie authentication
- ✅ Expected response format: `{success, message, data}`
- ✅ Proper error handling with 401 redirects

### 🔐 2. Authentication Integration (Already Done)
The `contexts/AuthContext.tsx` handles:
- ✅ Login with cookie-based authentication
- ✅ User session management
- ✅ Auto-redirect on authentication failure

### 📚 3. Attendance Service (Updated for Your Backend)
The `services/attendanceService.ts` now supports all your backend endpoints:

```typescript
// Available methods:
getCourses()           // GET /api/attendance/courses
addCourse(name, color) // POST /api/attendance/courses
deleteCourse(id)       // DELETE /api/attendance/courses/:id
markAttendance(courseId, date, status) // POST /api/attendance/courses/:id/mark
getStats()            // GET /api/attendance/stats
getCalendarData()     // GET /api/attendance/calendar
getWeekSummary()      // GET /api/attendance/week-summary
```

## 🎯 Backend API Endpoints Expected by Frontend

### Authentication Endpoints (Required)
```javascript
POST /api/auth/login
POST /api/auth/logout
GET /api/user/me
```

### Attendance Endpoints (Updated to match your backend)
```javascript
// Course Management
GET    /api/attendance/courses           // Get all user courses
POST   /api/attendance/courses           // Create new course
DELETE /api/attendance/courses/:id       // Delete course

// Attendance Tracking  
POST   /api/attendance/courses/:id/mark  // Mark attendance
// Body: { date: "YYYY-MM-DD", status: "attended" | "missed" | "clear" }

// Statistics & Analytics
GET    /api/attendance/stats            // Get overall stats
GET    /api/attendance/calendar         // Get calendar data
GET    /api/attendance/week-summary     // Get week summary
```

## 🚀 Current Frontend Features

The Attendance Tracker page (`pages/AttendanceTrackerPage.tsx`) includes:

### ✅ Enhanced UI Features
- **Prominent subject display** above calendar
- **Clear instructions** with numbered steps
- **3-state click behavior**: unmarked → attended → missed → unmarked
- **Futuristic theme** with neon effects and animations

### ✅ Calendar Functionality
- **Single-click cycling** through attendance states
- **Visual indicators**: Green (attended), Red with X (missed), Gray (unmarked)
- **Month navigation** with left/right arrows
- **Future date protection** (cannot mark future dates)

### ✅ Course Management
- **Add new courses** with color customization
- **Delete courses** with confirmation modal
- **Course selection** with visual feedback
- **Progress bars** showing attendance percentage

### ✅ Data Visualization
- **Hexagonal graph** showing attendance overview
- **Real-time statistics** with animated counters
- **Course-specific coloring** throughout the UI

## 🔄 Backend Response Format Expected

All backend responses should follow this format:

```javascript
// Success Response
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    // Actual response data here
  }
}

// Error Response
{
  "success": false,
  "message": "Course name is required",
  "data": null
}
```

## 📊 Expected Data Structures

### Course Object
```javascript
{
  "_id": "course_id",
  "name": "Data Structures",
  "color": "#8B5CF6",
  "attendedDays": ["2025-01-15", "2025-01-17"],
  "missedDays": ["2025-01-16"],
  "userId": "user_id",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

### Statistics Object
```javascript
{
  "totalCourses": 5,
  "totalClasses": 45,
  "totalAttended": 38,
  "overallAttendanceRate": 84.4,
  "courseStats": [
    {
      "courseId": "id1",
      "courseName": "Mathematics",
      "color": "#8B5CF6",
      "total": 10,
      "attended": 8,
      "attendanceRate": 80
    }
  ]
}
```

## 🛠️ Integration Testing

To test the integration, you can add debugging to the frontend:

### Debug API Calls
Add this to your `services/api.ts` for debugging:

```typescript
// Add before the request function
const DEBUG = true;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  if (DEBUG) {
    console.log('🔍 API Request:', {
      method: options.method || 'GET',
      url,
      body: options.body,
      credentials: 'include'
    });
  }

  // ... rest of existing code
  
  const response = await fetch(url, config);
  
  if (DEBUG) {
    const clonedResponse = response.clone();
    const responseData = await clonedResponse.json();
    console.log('📥 API Response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    });
  }
  
  return handleResponse<T>(response);
}
```

### Test Authentication
Add this to verify authentication is working:

```typescript
// In AttendanceTrackerPage.tsx, add this useEffect for testing
useEffect(() => {
  const testAuth = async () => {
    try {
      const user = await api.get('/user/me');
      console.log('✅ Auth working, user:', user);
    } catch (error) {
      console.log('❌ Auth failed:', error);
    }
  };
  testAuth();
}, []);
```

## ⚠️ Critical Backend Requirements

### 1. CORS Configuration
Make sure your backend allows:
```javascript
{
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### 2. Cookie Configuration
Set up cookies properly for authentication:
```javascript
res.cookie('jwt', token, {
  httpOnly: true,
  secure: false, // Set to true in production
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
```

### 3. Authentication Middleware
Make sure all attendance routes require authentication:
```javascript
router.use('/attendance/*', requireAuth);
```

## 🎯 Next Steps

1. **Start your backend server** on `http://localhost:5001`
2. **Ensure CORS is properly configured** to allow frontend requests
3. **Test authentication** by logging in through the frontend
4. **Verify course creation** works from the Attendance Tracker page
5. **Test attendance marking** by clicking calendar dates

The frontend is **ready to go** and will work seamlessly with your backend once it's running! 🚀

## 🔧 Troubleshooting Common Issues

### Issue: 401 Unauthorized
- Check if backend authentication middleware is working
- Verify cookies are being sent with requests
- Ensure CORS allows credentials

### Issue: CORS Errors
- Add frontend URL to CORS allowed origins
- Set `credentials: true` in CORS config
- Check preflight requests are handled

### Issue: Response Format Errors
- Ensure all backend responses use `{success, message, data}` format
- Check error responses also follow the format
- Verify data types match frontend expectations

### Issue: Calendar Not Working
- Check date format is YYYY-MM-DD
- Verify attendance marking endpoint accepts POST requests
- Ensure course data includes `attendedDays` and `missedDays` arrays

---

**The frontend is production-ready and waiting for your backend! 🎉**
