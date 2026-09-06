import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, GraduationCap, Award, ShieldCheck, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState('student');

  // Login form state
  const [email, setEmail] = useState('alex@student.com');
  const [password, setPassword] = useState('password123');

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('student');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick preset accounts
  const demoAccounts = [
    {
      role: 'student',
      title: 'Student Portal',
      name: 'Alex Rivera',
      email: 'alex@student.com',
      desc: 'Fresh student ready to take the MAPS diagnostic exam',
      icon: GraduationCap,
      color: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5',
      badge: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      role: 'mentor',
      title: 'Mentor Portal',
      name: 'Prof. Sarah Jenkins',
      email: 'prof.sarah@mentor.com',
      desc: 'Reviews periodic test requests & monitors study thresholds',
      icon: Award,
      color: 'border-blue-500/30 hover:border-blue-500 bg-blue-500/5',
      badge: 'bg-blue-500/20 text-blue-400',
    },
    {
      role: 'faculty',
      title: 'Faculty Portal',
      name: 'Dr. Robert Vance',
      email: 'dr.jenkins@faculty.com',
      desc: 'Oversees student rosters, item bank, and course curricula',
      icon: ShieldCheck,
      color: 'border-purple-500/30 hover:border-purple-500 bg-purple-500/5',
      badge: 'bg-purple-500/20 text-purple-400',
    },
  ];

  const handleSelectPreset = (account) => {
    setActiveRoleTab(account.role);
    setEmail(account.email);
    setPassword('password123');
    setError('');
  };

  const handleRoleTabChange = (role) => {
    setActiveRoleTab(role);
    setError('');
    if (role === 'student') setEmail('alex@student.com');
    if (role === 'mentor') setEmail('prof.sarah@mentor.com');
    if (role === 'faculty') setEmail('dr.jenkins@faculty.com');
    setPassword('password123');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        password: regPassword,
        role: regRole,
      });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 shadow-xl shadow-indigo-500/20 mb-4">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Adaptive Learning Platform
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Intelligent MAPS Diagnostic Placement &amp; Mentor-Guided Evaluation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        {/* Quick-Access Persona Presets */}
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Quick 1-Click Login (Pre-Configured Accounts)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {demoAccounts.map((acc) => {
              const IconComp = acc.icon;
              const isSelected = !isRegistering && email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectPreset(acc)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected ? 'ring-2 ring-indigo-500 ' + acc.color : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${acc.badge}`}>
                      {acc.role}
                    </span>
                    <IconComp className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="font-semibold text-sm text-slate-100">{acc.name}</div>
                  <div className="text-xs text-slate-400 truncate">{acc.email}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-md">
          {/* Tabs: Student vs Mentor vs Faculty */}
          {!isRegistering && (
            <div className="flex rounded-xl bg-slate-950/80 p-1 mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => handleRoleTabChange('student')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  activeRoleTab === 'student' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Student Portal
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('mentor')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  activeRoleTab === 'mentor' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mentor Portal
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabChange('faculty')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                  activeRoleTab === 'faculty' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Faculty Portal
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {!isRegistering ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In to {activeRoleTab.toUpperCase()} Portal
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  New Student? Register a new account
                </button>
              </div>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="jane.doe@student.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                  Account Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="student">Student (Will undergo MAPS diagnostic exam)</option>
                  <option value="mentor">Mentor</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  Already have an account? Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
