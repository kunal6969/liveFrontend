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
              Welcome to MNIT LIVE
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