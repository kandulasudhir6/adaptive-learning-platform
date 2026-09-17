import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { GraduationCap, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterPage({ onBack, onLoginClick }) {
  const { register } = useAuth();
  const [role, setRole] = useState(null); // 'student' | 'faculty'
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState(1); // 1: details, 2: otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await api.auth.requestOtp(email);
      setSuccess('Verification code sent! (Check backend terminal for the code)');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await register({ firstName, lastName, email, password, role, otp });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and code.');
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <h2 className="text-3xl font-black text-white mb-8 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">Register Account Type</h2>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl mb-8">
          <button 
            onClick={() => setRole('student')}
            className="flex-1 bg-gray-900 border border-gray-800 p-8 rounded-2xl flex flex-col items-center hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all group"
          >
            <GraduationCap className="w-16 h-16 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white">Student</h3>
            <p className="text-sm text-gray-400 mt-2 text-center">Join PRIVID to start your adaptive learning journey.</p>
          </button>
          
          <button 
            onClick={() => setRole('faculty')}
            className="flex-1 bg-gray-900 border border-gray-800 p-8 rounded-2xl flex flex-col items-center hover:border-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all group"
          >
            <ShieldCheck className="w-16 h-16 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white">Faculty</h3>
            <p className="text-sm text-gray-400 mt-2 text-center">Join to monitor and mentor students across the platform.</p>
          </button>
        </div>
        <p className="text-gray-400 text-sm">
          Already have an account? <button onClick={onLoginClick} className="text-purple-400 font-bold hover:underline">Login here</button>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <button 
        onClick={() => { setRole(null); setStep(1); setError(''); setSuccess(''); }} 
        className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Change Role
      </button>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white capitalize">{role} Registration</h2>
          <p className="text-gray-400 text-sm mt-1">Create your PRIVID account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm text-green-200">{success}</p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Code'}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={onLoginClick} className="text-sm text-gray-400 hover:text-white">Already have an account? Login</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Verification Code (OTP)</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-center tracking-[0.5em] font-mono text-xl"
                placeholder="123456"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
            
            <button
              type="button"
              onClick={() => { setStep(1); setSuccess(''); }}
              className="w-full py-2 text-sm text-gray-400 hover:text-white"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
