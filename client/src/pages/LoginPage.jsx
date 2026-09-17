import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { GraduationCap, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage({ onBack }) {
  const { login } = useAuth();
  const [role, setRole] = useState(null); // 'student' | 'faculty'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState(1); // 1: credentials, 2: otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (role === 'student' && !password) {
      setError('Please enter your password.');
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await login(email, password, otp);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials and code.');
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
        <h2 className="text-3xl font-black text-white mb-8 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">Choose Your Account Type</h2>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
          <button 
            onClick={() => setRole('student')}
            className="flex-1 bg-gray-900 border border-gray-800 p-8 rounded-2xl flex flex-col items-center hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all group"
          >
            <GraduationCap className="w-16 h-16 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white">Student Login</h3>
            <p className="text-sm text-gray-400 mt-2 text-center">Access your adaptive curriculum, take exams, and view your roadmap.</p>
          </button>
          
          <button 
            onClick={() => setRole('faculty')}
            className="flex-1 bg-gray-900 border border-gray-800 p-8 rounded-2xl flex flex-col items-center hover:border-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all group"
          >
            <ShieldCheck className="w-16 h-16 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white">Faculty Login</h3>
            <p className="text-sm text-gray-400 mt-2 text-center">Monitor student progress, manage roadmaps, and review performance.</p>
          </button>
        </div>
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
          <h2 className="text-2xl font-bold text-white capitalize">{role} Login</h2>
          <p className="text-gray-400 text-sm mt-1">Secure authentication via PRIVID</p>
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
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="you@example.com"
              />
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Code'}
            </button>
            
            {role === 'student' && (
              <p className="text-center text-xs text-gray-500 pt-2">
                Use alex@student.com / password123 for testing.
              </p>
            )}
            {role === 'faculty' && (
              <p className="text-center text-xs text-gray-500 pt-2">
                Use dr.jenkins@faculty.com for testing.
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
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
