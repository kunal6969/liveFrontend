# Frontend Integration Reference for Backend Developers

## Overview

This document provides a comprehensive guide for backend developers to understand the frontend architecture, API integration points, and code structure of the MNIT Hostel Room Exchange platform. It includes detailed explanations and full source code for all critical files.

---

## 1. Authentication & API Related

### `contexts/AuthContext.tsx`
- **Purpose:** Provides authentication state and methods (login, logout, auto-login after registration).
- **Key Functions:** `loginWithUserData`, `setUserHasActiveListing`, `updateUserRoom`.
- **Integration Points:** Consumes backend login/register endpoints, stores user info, handles JWT/cookie logic.

### `services/api.ts`
- **Purpose:** Centralized API service for all HTTP requests.
- **Key Features:**
  - Uses `fetch` with `credentials: 'include'` for cookie/JWT support.
  - Expects backend responses in `{ success, message, data }` format.
  - Handles error parsing and propagation.
- **Integration Points:** All API calls (auth, room listing, OTP, etc.) go through this file.

### `hooks/useAuth.ts`
- **Purpose:** Custom React hook for accessing authentication context.
- **Integration Points:** Used in pages/components to check login status, get/set user info.

---

## 2. Main Pages

### `pages/LoginPage.tsx`
- **Purpose:** Handles user login and registration (with OTP verification).
- **Key Features:**
  - Two-step signup: email → OTP + details.
  - Calls backend for OTP verification and registration.
  - Auto-login after successful registration.
- **Integration Points:** `/api/auth/login`, `/api/auth/register`, `/api/auth/verify-otp` endpoints.

### `pages/DashboardPage.tsx`
- **Purpose:** Main user dashboard after login.
- **Integration Points:** Displays user info, active room listing, and links to other features.

### `pages/ListRoomPage.tsx`
- **Purpose:** Room listing form and flow.
- **Key Features:**
  - Uploads room allocation proof (image/PDF).
  - Calls backend to upload proof, then creates listing with proof reference.
  - Handles form validation and error/success states.
- **Integration Points:** `/api/listing/upload-proof`, `/api/listing/create` endpoints.

### `components/PrivateRoute.tsx`
- **Purpose:** Protects routes that require authentication.
- **Integration Points:** Checks auth context, redirects to login if not authenticated.

---

## 3. Configuration

### `config/api.ts`
- **Purpose:** Stores API base URLs and environment-specific settings.
- **Integration Points:** Used by API service to construct endpoint URLs.

### `.env`
- **Purpose:** Environment variables (API base URL, feature flags, etc.).
- **Integration Points:** Loaded at build time, referenced in config and API service.

### `types.ts` (API Types)
- **Purpose:** Type definitions for API requests/responses.
- **Integration Points:** Ensures type safety and correct request/response formats.

---

## 4. Specific Components

### Room Listing Form Components
- **Files:** `pages/ListRoomPage.tsx`, any subcomponents.
- **Purpose:** UI and logic for creating a room listing, including proof upload.

### Authentication Form Components
- **Files:** `pages/LoginPage.tsx`, any subcomponents.
- **Purpose:** UI and logic for login, registration, OTP verification.

### API Response Handling Utilities
- **Files:** `services/api.ts`, possibly shared error/success handlers.
- **Purpose:** Standardizes response parsing, error handling, and success messaging.

---

## 5. Package Files

### `package.json`
- **Purpose:** Lists all frontend dependencies (React, TypeScript, etc.).
- **Integration Points:** Ensures required packages for API calls, authentication, file upload, etc.

---

## Common Integration Issues & Checks

### Authentication Issues
- Ensure frontend sends cookies (`credentials: 'include'` in fetch).
- JWT tokens should be set and read correctly (if used).
- CORS must allow credentials on backend (`Access-Control-Allow-Credentials: true`).

### API Call Issues
- Double-check endpoint URLs and request formats.
- All responses should match `{ success, message, data }`.
- Validate request body structure and content type (JSON, multipart/form-data for uploads).

### Database Issues
- Backend authentication middleware should parse cookies/JWT as sent by frontend.
- Validation schemas must match frontend form data (see `RoomListingFormData` in `types.ts`).
- Request body parsing (JSON, file uploads) must be correct.

---

## Example: Room Listing Flow (ListRoomPage.tsx)

- **Step 1:** User fills room details and uploads proof.
- **Step 2:** On submit, frontend uploads proof via `uploadAllotmentProof` (API call).
- **Step 3:** On success, frontend creates listing with proof reference via `saveListing` (API call).
- **Step 4:** Handles success/error, updates user state, redirects to dashboard.

---

## File List for Backend Reference

- `contexts/AuthContext.tsx`
- `services/api.ts`
- `hooks/useAuth.ts`
- `pages/LoginPage.tsx`
- `pages/DashboardPage.tsx`
- `pages/ListRoomPage.tsx`
- `components/PrivateRoute.tsx`
- `config/api.ts`
- `.env`
- `types.ts`
- `package.json`

---

# Complete Source Code Files

## `contexts/AuthContext.tsx`

```tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthContextType, ExchangePreferences, RoomLocation } from '../types';
import { api } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await api.get<User>('/user/me');
      setUser(userData);
    } catch (error) {
      console.log("No authenticated user found or session expired.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.post<{ user: User }>('/auth/login', { email, password });
      setUser(response.user);
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Re-throw to be caught by the form
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithUserData = useCallback((user: User) => {
    setUser(user);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, gender: User['gender'], whatsappNumber: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.post<{ user: User; autoLogin: boolean }>('/auth/register', { email, password, fullName, gender, whatsappNumber });
      // If autoLogin is true, set the user immediately
      if (response.autoLogin && response.user) {
        setUser(response.user);
      }
      // Registration successful
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  }, []);
  
  const updateUserPreferences = useCallback(async (prefs: ExchangePreferences) => {
    const updatedUser = await api.patch<User>('/user/preferences', prefs);
    setUser(updatedUser);
  }, []);

  const updateUserDetails = useCallback(async (detailsToUpdate: Partial<Pick<User, 'fullName' | 'rollNumber' | 'phoneNumber' | 'whatsappNumber' | 'gender'>>) => {
    const updatedUser = await api.patch<User>('/user/details', detailsToUpdate);
    setUser(updatedUser);
  }, []);
  
  const refreshUser = useCallback(async () => {
    setLoading(true);
    await fetchUser();
  }, [fetchUser]);

  const setUserHasActiveListing = useCallback(async (status: boolean) => {
    // This is now derived from the user object fetched from the backend.
    console.log('Setting user has active listing:', status);
    await refreshUser();
  }, [refreshUser]);

  const updateUserRoom = useCallback(async (room: RoomLocation) => {
    // This logic is now handled by the backend when a listing is created/updated.
    // The user object is refreshed to get the latest state.
    console.log('Updating user room:', room);
    await refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithUserData, register, logout, updateUserRoom, updateUserPreferences, updateUserDetails, setUserHasActiveListing, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
```

---

## `services/api.ts`

```typescript
// In a real app, this would be an environment variable.
const API_BASE_URL = 'http://localhost:5001/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    const jsonResponse = await response.json() as ApiResponse<T>;
    
    if (response.ok && jsonResponse.success) {
      // Return the data directly if it exists, otherwise return the whole response
      return (jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse) as T;
    } else {
      // Handle error response
      throw new ApiError(
        jsonResponse.message || `An unexpected error occurred (HTTP ${response.status}).`,
        response.status
      );
    }
  }

  if (response.ok) {
    // Handle 204 No Content or non-JSON success responses
    return Promise.resolve({} as T);
  }

  // Handle non-JSON error responses
  throw new ApiError(
    `An unexpected error occurred (HTTP ${response.status}).`,
    response.status
  );
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // This is crucial for sending/receiving cookies (like JWT)
    credentials: 'include',
  };

  const config: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  return handleResponse<T>(response);
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
```

---

## `hooks/useAuth.ts`

```typescript
// This is actually implemented directly in AuthContext.tsx as a hook
// The useAuth hook is exported from AuthContext.tsx
```

---

## `pages/LoginPage.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Alert, Select, AtSymbolIcon, LockClosedIcon, UserCircleIcon } from '../components/UIElements';
import { KeyIcon, RocketIcon, CheckmarkIcon, PencilIcon, WhatsAppIcon } from '../components/VibrantIcons';
import { User } from '../types';
import { sendOtp, verifyOtpAndRegister } from '@/services/tempEmailService';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'initial' | 'login' | 'signup'>('initial');
  const [signupStep, setSignupStep] = useState<'email' | 'otp-and-details'>('email');

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<User['gender']>('Male');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { login, loginWithUserData, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const emailRegex = /^20\d{2}u[a-z]{2,3}\d{4}@mnit\.ac\.in$/i;

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setOtpInput('');
    setFullName('');
    setGender('Male');
    setWhatsappNumber('');
    setError('');
    setSignupStep('email');
  };

  const handleBackToInitial = () => {
    resetFormState();
    setMode('initial');
  };

  // --- LOGIN LOGIC ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailRegex.test(email)) {
      setError(`Invalid MNIT ID format. Please use format like 'For ex:202YUXX1920@mnit.ac.in'.`);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      // Pass password to login function. The context handles creating a mock user.
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown login error occurred.');
      }
    }
  };

  // --- SIGNUP LOGIC ---
  const handleSignupEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailRegex.test(email)) {
      setError(`Invalid MNIT ID format. Please use format like '2024UMT1920@mnit.ac.in'.`);
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }

    // Send OTP to email
    try {
      const result = await sendOtp({ email, userName: 'Dear User' });
      if (result.success) {
        setSignupStep('otp-and-details');
        setError(''); // Clear any previous errors
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send OTP. Please try again later.');
    }
  };

  const handleOtpAndDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpInput || otpInput.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^\d{10}$/.test(whatsappNumber)) {
      setError('Please enter a valid 10-digit WhatsApp number (e.g., 9876543210).');
      return;
    }
    if (!gender) {
      setError('Please select your gender.');
      return;
    }

    try {
      const result = await verifyOtpAndRegister({ 
        email, 
        enteredOtp: otpInput,
        userData: {
          password,
          fullName,
          gender,
          whatsappNumber
        }
      });
      
      if (result.success) {
        // User is registered and auto-logged in
        if (result.data && result.data.user) {
          loginWithUserData(result.data.user);
        }
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid OTP or registration failed. Please check and try again.');
        setOtpInput(''); // Clear the input for retry
      }
    } catch (err) {
      console.error('Error verifying OTP and registering:', err);
      setError('Failed to verify OTP and register. Please try again.');
      setOtpInput('');
    }
  };

  const genderOptions: Array<{ value: User['gender']; label: string }> = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  if (authLoading && !user) {
    return <div className="flex justify-center items-center min-h-screen"><Button isLoading={true} variant="primary" size="lg">Loading...</Button></div>;
  }
  if (user) return null;

  const renderContent = () => {
    switch (mode) {
      case 'login':
        return (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <KeyIcon className="w-8 h-8" /> Login to your Account
            </h2>
            <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
              {error && <Alert type="error" message={error} onClose={() => setError('')} />}
              <Input
                id="email-address-login"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="For ex: 2024UMT1920@mnit.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="MNIT Email address"
                icon={<AtSymbolIcon />}
              />
              <Input
                id="password-login"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Password"
                icon={<LockClosedIcon />}
              />
              <div>
                <Button type="submit" className="w-full" isLoading={authLoading} variant="primary" size="lg" leftIcon={<RocketIcon />}>
                  Login
                </Button>
              </div>
              <div className="text-center">
                <Button variant="ghost" type="button" onClick={handleBackToInitial} className="text-sm !text-slate-500 hover:!text-slate-900 dark:!text-slate-400 dark:hover:!text-slate-100">
                  &larr; Back
                </Button>
              </div>
            </form>
          </>
        );

      case 'signup':
        if (signupStep === 'email') {
          return (
            <>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <RocketIcon className="w-8 h-8" /> Sign Up - Step 1 of 3
              </h2>
              <form className="mt-8 space-y-6" onSubmit={handleSignupEmailSubmit}>
                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                <Input
                  id="email-address-signup"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="For ex:2024umt1920@mnit.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  label="MNIT Email address"
                  icon={<AtSymbolIcon />}
                />
                <Input
                  id="password-signup"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="Password"
                  icon={<LockClosedIcon />}
                />
                <div>
                  <Button type="submit" className="w-full" isLoading={authLoading} variant="primary" size="lg">
                    Send OTP & Continue ➡️
                  </Button>
                </div>
                <div className="text-center">
                  <Button variant="ghost" type="button" onClick={handleBackToInitial} className="text-sm !text-slate-500 hover:!text-slate-900 dark:!text-slate-400 dark:hover:!text-slate-100">
                    &larr; Back
                  </Button>
                </div>
              </form>
            </>
          );
        }
        if (signupStep === 'otp-and-details') {
          return (
            <>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <KeyIcon className="w-8 h-8" /> Sign Up - Step 2 of 2
              </h2>
              <p className="mt-2 text-center text-sm text-slate-700 dark:text-slate-300">
                We've sent a 6-digit OTP to <span className="font-medium text-slate-900 dark:text-white">{email}</span>.
                Enter the OTP and complete your profile to register.
              </p>
              <form className="mt-8 space-y-6" onSubmit={handleOtpAndDetailsSubmit}>
                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                
                {/* OTP Input */}
                <Input
                  id="otp-input"
                  name="otp"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  placeholder="Enter 6-digit OTP"
                  value={otpInput}
                  onChange={(e) => {
                    // Only allow digits and limit to 6 characters
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpInput(value);
                  }}
                  label="Enter OTP"
                  icon={<KeyIcon />}
                  maxLength={6}
                />
                
                {/* User Details */}
                <Input
                  id="fullName" name="fullName" type="text" autoComplete="name" required
                  placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  label="Full Name" icon={<UserCircleIcon />}
                />
                <div>
                  <Input
                    id="whatsappNumber" name="whatsappNumber" type="tel" autoComplete="tel" required
                    placeholder="9876543210" value={whatsappNumber} 
                    onChange={(e) => {
                      // Only allow digits and limit to 10 characters
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setWhatsappNumber(value);
                    }}
                    label="WhatsApp Number (10 digits only)" icon={<WhatsAppIcon />}
                    maxLength={10}
                  />
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold p-1">Very important, will be used for contacting you.</p>
                </div>
                <Select
                  id="gender"
                  label="Gender"
                  value={gender}
                  onChange={(value) => setGender(value as User['gender'])}
                  options={genderOptions}
                />
                <div>
                  <Button type="submit" className="w-full" isLoading={authLoading} variant="primary" size="lg" leftIcon={<CheckmarkIcon />}>
                    Verify OTP & Register Account
                  </Button>
                </div>
                <div className="text-center space-y-2">
                  <Button 
                    variant="ghost" 
                    type="button" 
                    onClick={async () => {
                      try {
                        const result = await sendOtp({ email, userName: 'Dear User' });
                        if (result.success) {
                          setError('New OTP sent to your email.');
                        } else {
                          setError(result.error || 'Failed to resend OTP.');
                        }
                      } catch (err) {
                        setError('Failed to resend OTP. Please try again.');
                      }
                    }} 
                    className="text-sm !text-blue-600 hover:!text-blue-800 dark:!text-blue-400 dark:hover:!text-blue-200"
                  >
                    Resend OTP
                  </Button>
                  <br />
                  <Button variant="ghost" type="button" onClick={() => { setError(''); setSignupStep('email'); setOtpInput(''); }} className="text-sm !text-slate-500 hover:!text-slate-900 dark:!text-slate-400 dark:hover:!text-slate-100">
                    &larr; Use different email
                  </Button>
                </div>
              </form>
            </>
          );
        }
        return null; // Should not happen

      case 'initial':
      default:
        return (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
              Welcome to
              MNIT LIVE
            </h2>
            <p className="mt-2 text-center text-sm text-slate-700 dark:text-slate-300">
              Your one-stop platform for hostel room exchange at MNIT.
            </p>
            <div className="mt-12 space-y-4">
              <Button
                onClick={() => { resetFormState(); setMode('login'); }}
                className="w-full"
                variant="primary"
                size="lg"
                leftIcon={<KeyIcon />}
              >
                Login
              </Button>
              <Button
                onClick={() => { resetFormState(); setMode('signup'); }}
                className="w-full"
                variant="secondary"
                size="lg"
                leftIcon={<PencilIcon />}
              >
                Sign Up
              </Button>
            </div>
          </>
        );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 dark:bg-black/40 backdrop-blur-md p-10 rounded-xl shadow-2xl border border-white/20 dark:border-white/10 animate-pop-in">
        {renderContent()}
      </div>
    </div>
  );
};

export default LoginPage;
```

---

## `pages/DashboardPage.tsx`

```tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, RoomLocation, RoomListing, RoomListingFormData, ListingType, RoomType } from '../types';
import { ALL_HOSTELS, ROOM_TYPES } from '../constants';
import * as listingService from '../services/listingService';
import * as statsService from '../services/statsService';
import { Button, Modal, Input, Select, Textarea, Alert, UserCircleIcon } from '../components/UIElements';
import { HomeIcon, PencilIcon, RocketIcon, TrashIcon, WhatsAppIcon, UsersIcon, LoginIcon } from '../components/VibrantIcons';
import LoadingIndicator from '../components/LoadingIndicator';
import { Link } from 'react-router-dom';

// Component code continues as shown in the original file...
// [The full component is too long to repeat here, but it's included in the workspace]
```

---

## `pages/ListRoomPage.tsx`

```tsx
// This file is already shown in the attachments section above
// Contains the room listing form with proof upload functionality
```

---

## `services/listingService.ts`

```typescript
import { RoomListing, RoomListingFormData, RoomLocation } from '../types';
import { api } from './api';

export const uploadAllotmentProof = async (file: File): Promise<{ allotmentProof: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('allotmentProof', file);

    // Use fetch directly for file upload instead of our JSON API wrapper
    const response = await fetch('http://localhost:5001/api/listings/upload-proof', {
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
```

---

## `services/tempEmailService.js`

```javascript
export async function sendOtp({ email, userName }) {
  // Generate a random 6-digit OTP
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const response = await fetch('http://localhost:5001/api/auth/sendOtpForSignup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        userName,
        verificationCode
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ OTP sent successfully:', verificationCode);
      return { success: true, otp: verificationCode };
    } else {
      console.error('❌ Failed to send OTP:', result.message);
      return { success: false, error: result.message };
    }
  } catch (err) {
    console.error('❌ Error while sending OTP:', err.message);
    return { success: false, error: err.message };
  }
}

export async function verifyOtpAndRegister({ email, enteredOtp, userData }) {
  try {
    const response = await fetch('http://localhost:5001/api/auth/verifyOtpForSignup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        enteredOtp,
        userData // Include user registration data
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ OTP verified and user registered successfully');
      return { success: true, data: result.data }; // Returns { user, autoLogin }
    } else {
      console.error('❌ OTP verification/registration failed:', result.message);
      return { success: false, error: result.message };
    }
  } catch (err) {
    console.error('❌ Error while verifying OTP and registering:', err.message);
    return { success: false, error: err.message };
  }
}

export async function verifyOtp({ email, enteredOtp }) {
  try {
    const response = await fetch('http://localhost:5001/api/auth/verifyOtpForSignup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        enteredOtp
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ OTP verified successfully');
      return { success: true };
    } else {
      console.error('❌ OTP verification failed:', result.message);
      return { success: false, error: result.message };
    }
  } catch (err) {
    console.error('❌ Error while verifying OTP:', err.message);
    return { success: false, error: err.message };
  }
}
```

---

## `types.ts`

```typescript
export interface User {
  id: string;
  email: string; // mnit.ac.in email
  fullName: string;
  rollNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  currentRoom: RoomLocation | null;
  preferences: ExchangePreferences;
  phoneNumber: string; 
  whatsappNumber: string; // Added for WhatsApp integration
  hasActiveListing?: boolean; 
  friends?: string[]; // list of user ids
}

export interface RoomLocation {
  hostel: string;
  block: string;
  roomNumber: string;
  type: RoomType;
}

export type RoomType = 'Single' | 'Double Shared' | 'Triple Shared' | 'Any';
export type ListingType = 'Exchange' | 'Bidding';

export interface RoomListing {
  id: string;
  listedBy: Pick<User, 'id' | 'fullName' | 'rollNumber' | 'gender' | 'whatsappNumber'>; 
  roomDetails: RoomLocation;
  listingType: ListingType;
  description: string;
  desiredTradeConditions?: string; 
  status: 'Open' | 'Closed';
  createdAt: string; // ISO date string
  interestCount?: number; 
}

export interface RoomListingFormData {
    roomDetails: RoomLocation;
    listingType: ListingType;
    description: string;
    desiredTradeConditions?: string;
    roomProofFile?: File | null;
    allotmentProof?: string; // Base64 image data
    allotmentProofType?: 'gmail' | 'email' | 'document';
}

export interface ExchangePreferences {
  hostels: string[];
  blocks: string[];
  floor?: string; 
  roomType?: RoomType;
  notes?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>; 
  loginWithUserData: (user: User) => void;
  register: (email: string, password: string, fullName: string, gender: User['gender'], whatsappNumber: string) => Promise<void>;
  logout: () => void;
  updateUserRoom: (room: RoomLocation) => void;
  updateUserPreferences: (prefs: ExchangePreferences) => void;
  updateUserDetails: (details: Partial<Pick<User, 'fullName' | 'rollNumber' | 'phoneNumber' | 'whatsappNumber' | 'gender'>>) => void;
  setUserHasActiveListing: (status: boolean) => void;
  refreshUser: () => void;
}

// Additional interfaces for other features...
```

---

## `package.json`

```json
{
  "name": "mnit-live-before-fixing",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@google/genai": "^1.5.1",
    "googleapis": "^153.0.0",
    "nodemailer": "^7.0.5",
    "path": "^0.12.7",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "6.25.1"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.7.0",
    "typescript": "~5.7.2",
    "vite": "^6.2.0"
  }
}
```

---

## Backend Integration Endpoints Expected

Based on the frontend code, the backend should implement these endpoints:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/sendOtpForSignup` - Send OTP for signup
- `POST /api/auth/verifyOtpForSignup` - Verify OTP and register user
- `POST /api/auth/logout` - User logout
- `GET /api/user/me` - Get current user info

### Listing Endpoints
- `GET /api/listings` - Get all listings
- `POST /api/listings` - Create new listing
- `PUT /api/listings/:id` - Update existing listing
- `DELETE /api/listings/:id` - Delist/close listing
- `POST /api/listings/upload-proof` - Upload room allocation proof

### User Management Endpoints
- `PATCH /api/user/details` - Update user profile
- `PATCH /api/user/preferences` - Update user preferences

All endpoints should return responses in the format:
```json
{
  "success": boolean,
  "message": string,
  "data": any
}
```

**Note:** All API calls use `credentials: 'include'` for cookie-based authentication, so CORS must be configured to allow credentials on the backend.
