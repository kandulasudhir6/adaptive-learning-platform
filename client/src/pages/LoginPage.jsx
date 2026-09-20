import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { GraduationCap, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function LoginPage({ onBack, onRegisterClick }) {
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState(1); // 1: phone, 2: otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved
        }
      });
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter your phone number with country code (e.g. +1234567890).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      // Pass token to backend
      const res = await api.post('/auth/login', { idToken });
      
      if (res.success) {
        login(res.token, res.user);
      } else {
        setError(res.error || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid OTP or user not found (Please register first).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <div className="flex justify-center text-indigo-600 mb-2">
          <GraduationCap className="w-12 h-12" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome Back to EduVibe
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in securely with your mobile number
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div id="recaptcha-container"></div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone Number (e.g. +1234567890)</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+15555550100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP via SMS'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">6-Digit OTP</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={onRegisterClick}
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-500"
            >
              Don't have an account? Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
