import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { GraduationCap, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function RegisterPage({ onBack, onLoginClick }) {
  const { login } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('student');
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {}
      });
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !phoneNumber) {
      setError('Please fill in all fields.');
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
      
      const res = await api.post('/auth/register', {
        idToken,
        firstName,
        lastName,
        role
      });
      
      if (res.success) {
        login(res.token, res.user);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid OTP or network error.');
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
          Create an Account
        </h2>
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
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Last Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Phone Number (e.g. +1234567890)</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+15555550100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">6-Digit OTP</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Register'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={onLoginClick}
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-500"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
