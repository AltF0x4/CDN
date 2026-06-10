import React, { useState, useEffect } from 'react';
import { SignupPassword } from '@auth0/auth0-acul-js'; // Imported as per the SDK guide[cite: 1]

const OKTA_WORKFLOW_URL = "https://oie-2732029.workflows.oktapreview.com/api/flo/fac21ee2a269c02f9caa6f595ec222a0/invoke?clientToken=2f9efc8b72a330660333c14fbba87ac41177ec171f1f988b0fb8e982b5984b80";

export default function CustomSignupPasswordPrompt() {
  const [screenProvider, setScreenProvider] = useState(null);
  const [step, setStep] = useState('FIELDS'); // 'FIELDS' | 'OTP'
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // UX States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Instantiate the ACUL SDK provider for this screen[cite: 1]
    setScreenProvider(new SignupPassword());
  }, []);

  // Step 1: Request OTP from Okta Workflows
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(OKTA_WORKFLOW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "send_otp",
          email: email,
          phoneNumber: phone
        })
      });

      if (!response.ok) throw new Error('Failed to dispatch verification code.');
      
      // Advance to OTP screen
      setStep('OTP');
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred triggering the SMS workflow.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP via Okta Workflows & POST to Auth0
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(OKTA_WORKFLOW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "verify_otp",
          email: email,
          phoneNumber: phone,
          code: otpCode
        })
      });

      const result = await response.json();

      // Adjust this condition based on your exact Okta Workflow return payload structure
      if (result.verified === true || response.ok) {
        
        // Formulate the exact payload Auth0 expects (application/x-www-form-urlencoded)[cite: 1]
        const auth0Payload = new URLSearchParams({
          email: email,
          password: password,
          'user_metadata.phone_number': phone,
          'user_metadata.phone_verified': 'true'
        });

        // Submit to the exact same Universal Login execution endpoint[cite: 1]
        const auth0Response = await fetch(window.location.href, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded', // Strict requirement[cite: 1]
          },
          body: auth0Payload.toString(),
        });

        if (auth0Response.redirected) {
          // Success! Follow the redirect chain back to your application
          window.location.href = auth0Response.url;
        } else {
          // Handle Auth0 validation errors (e.g., password does not meet complexity policies)
          const errText = await auth0Response.text();
          setErrorMessage('Auth0 account registration failed. Check password requirements.');
          console.error(errText);
        }
      } else {
        setErrorMessage('Invalid OTP code. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Verification system error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  if (!screenProvider) return <p>Loading secure registration interface...</p>;

  return (
    <div className="acul-form-wrapper">
      <h2>Create Your Account</h2>
      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      {step === 'FIELDS' && (
        <form onSubmit={handleRequestOtp}>
          <div className="input-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Phone Number (for MFA verification)</label>
            <input type="tel" placeholder="+1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Sending Verification...' : 'Verify Phone & Continue'}
          </button>
        </form>
      )}

      {step === 'OTP' && (
        <form onSubmit={handleVerifyAndRegister}>
          <p>We sent a secure validation code to <strong>{phone}</strong>.</p>
          
          <div className="input-group">
            <label>Enter 6-Digit Code</label>
            <input 
              type="text" 
              maxLength="6" 
              value={otpCode} 
              onChange={(e) => setOtpCode(e.target.value)} 
              required 
              autoFocus 
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Complete Registration'}
          </button>
          
          <button type="button" className="btn-secondary" onClick={() => setStep('FIELDS')} disabled={loading}>
            Back
          </button>
        </form>
      )}
    </div>
  );
}
