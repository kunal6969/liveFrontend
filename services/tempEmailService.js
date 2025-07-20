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