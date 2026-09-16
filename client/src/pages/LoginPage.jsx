import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  GraduationCap, ShieldCheck, QrCode, Sparkles, LogIn, UserPlus,
  RefreshCw, Clock, CheckCircle2, AlertCircle, Smartphone, Eye, EyeOff,
} from 'lucide-react';

function buildQRUrl(sessionToken) {
  const base = window.location.origin;
  return `${base}/faculty-auth?token=${sessionToken}`;
}

export default function LoginPage() {
  const { login, loginWithToken, register } = useAuth();
  const [activeRoleTab, setActiveRoleTab] = useState('student');
  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState('alex@student.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // QR state — backend returns { sessionToken, qrPayload, expiresAt } directly
  const [sessionToken, setSessionToken] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [simulatingFaculty, setSimulatingFaculty] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState('dr.jenkins@faculty.com');
  const [qrScanned, setQrScanned] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const clearTimers = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const initiateQR = async () => {
    clearTimers();
    setQrLoading(true);
    setQrScanned(false);
    setError('');
    setSessionToken(null);
    setQrValue('');
    try {
      const res = await api.auth.initiateFacultyQR();
      // Backend returns { success, sessionToken, qrPayload, expiresAt } (NOT res.session)
      if (res.success && res.sessionToken) {
        setSessionToken(res.sessionToken);
        // Use qrPayload JSON if available, else build URL
        setQrValue(res.qrPayload || buildQRUrl(res.sessionToken));
        setTimeLeft(180);
      } else {
        setError(res.error || 'Failed to initialize QR session');
      }
    } catch (err) {
      setError(err.message || 'QR session error');
    } finally {
      setQrLoading(false);
    }
  };

  const handleTabChange = (role) => {
    setActiveRoleTab(role);
    setError('');
    clearTimers();
    if (role === 'faculty') initiateQR();
  };

  // Countdown + polling once sessionToken is set
  useEffect(() => {
    if (activeRoleTab !== 'faculty' || !sessionToken) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((p) => { if (p <= 1) { clearTimers(); return 0; } return p - 1; });
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const statusRes = await api.auth.checkFacultyQR(sessionToken);
        if (statusRes.success && statusRes.status === 'verified') {
          clearTimers();
          loginWithToken(statusRes.token, statusRes.user);
        } else if (statusRes.status === 'expired') {
          clearTimers();
          setError('QR session expired. Please generate a new code.');
        }
      } catch (err) { console.error('QR poll error:', err); }
    }, 2000);

    return () => clearTimers();
  }, [activeRoleTab, sessionToken]);

  useEffect(() => () => clearTimers(), []);

  const handleSimulateScan = async () => {
    if (!sessionToken) return;
    setSimulatingFaculty(true);
    setQrScanned(true);
    setError('');
    try {
      const res = await api.auth.verifyFacultyQR({ sessionToken, facultyEmail: selectedFaculty });
      if (res.success && res.token && res.user) {
        loginWithToken(res.token, res.user);
      } else {
        setError(res.error || 'QR verification failed');
        setQrScanned(false);
      }
    } catch (err) {
      setError(err.message || 'Error verifying QR');
      setQrScanned(false);
    } finally {
      setSimulatingFaculty(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err.message || 'Login failed.'); }
    finally { setLoading(false); }
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await register({ firstName: regFirstName, lastName: regLastName, email: regEmail, password: regPassword, role: 'student' }); }
    catch (err) { setError(err.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const isExpired = timeLeft <= 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-10 px-4 sm:px-6">
      {/* Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-black text-gray-900">EduVibe AI</h1>
        <p className="mt-2 text-sm text-gray-500">Adaptive Learning Platform — Diagnostic MAPS &amp; Faculty-Mentored Roadmaps</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Role Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6 border border-gray-200">
            {[
              { id: 'student', label: 'Student Login', icon: GraduationCap },
              { id: 'faculty', label: 'Faculty (QR Scan)', icon: QrCode },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => handleTabChange(id)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeRoleTab === id ? 'bg-white text-indigo-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* ── STUDENT TAB ── */}
          {activeRoleTab === 'student' && (
            <div>
              {!isRegistering ? (
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">ST</div>
                      <div>
                        <div className="text-xs font-semibold text-gray-800">Alex Rivera (Demo Student)</div>
                        <div className="text-[11px] text-gray-400">Pre-filled for testing</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setEmail('alex@student.com'); setPassword('password123'); }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition cursor-pointer">
                      Fill Demo
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Email Address</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                      placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition disabled:opacity-50 cursor-pointer">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In as Student</>}
                  </button>
                  <div className="text-center pt-1">
                    <button type="button" onClick={() => { setIsRegistering(true); setError(''); }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 transition cursor-pointer">
                      <UserPlus className="w-3.5 h-3.5" /> New to EduVibe AI? Create Student Account
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleStudentRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[['First Name', regFirstName, setRegFirstName, 'Jane'], ['Last Name', regLastName, setRegLastName, 'Doe']].map(([label, val, setter, ph]) => (
                      <div key={label}>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
                        <input type="text" required value={val} onChange={(e) => setter(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder={ph} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Email Address</label>
                    <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="jane.doe@university.edu" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Password</label>
                    <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Create a secure password" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition disabled:opacity-50 cursor-pointer text-sm">
                    {loading ? 'Creating Account…' : 'Enroll as New Student'}
                  </button>
                  <div className="text-center">
                    <button type="button" onClick={() => setIsRegistering(false)} className="text-xs text-indigo-600 hover:text-indigo-800 transition cursor-pointer">
                      Already enrolled? Back to Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── FACULTY QR TAB ── */}
          {activeRoleTab === 'faculty' && (
            <div className="text-center space-y-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" /> Faculty Secure Access
                </h3>
                <p className="text-xs text-gray-500 mt-1">Scan this QR code with your authorized faculty device to sign in.</p>
              </div>

              {/* QR Display */}
              <div className="flex flex-col items-center gap-3">
                {qrLoading ? (
                  <div className="w-56 h-56 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-xs">Generating secure QR…</span>
                  </div>
                ) : sessionToken && !isExpired ? (
                  <div className="space-y-3">
                    <div className={`p-4 bg-white border-2 rounded-2xl shadow-md transition-all inline-block ${qrScanned ? 'border-green-400 shadow-green-100' : 'border-gray-200 hover:border-indigo-300'}`}>
                      <QRCodeSVG
                        value={qrValue}
                        size={200}
                        level="M"
                        fgColor="#1e293b"
                        bgColor="#ffffff"
                      />
                      {qrScanned && (
                        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-green-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> QR Scanned — Verifying…
                        </div>
                      )}
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold border ${
                      timeLeft < 30 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                        : timeLeft < 60 ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      <Clock className="w-3.5 h-3.5" /> Expires in {formatTime(timeLeft)}
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-56 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400 p-4">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                    <span className="text-xs font-medium text-gray-600">
                      {sessionToken ? 'QR Code Expired' : 'Ready to generate QR'}
                    </span>
                    <button type="button" onClick={initiateQR}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 transition cursor-pointer">
                      <RefreshCw className="w-3.5 h-3.5" /> {sessionToken ? 'Generate New Code' : 'Generate QR Code'}
                    </button>
                  </div>
                )}
              </div>

              {/* Simulate Scan */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-500" /> Simulate Faculty Scan
                  </span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">Browser Auth</span>
                </div>
                <p className="text-[11px] text-gray-400">In production, faculty scan this QR with their phone. Click below to simulate:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { email: 'dr.jenkins@faculty.com', name: 'Dr. Robert Jenkins', dept: 'AI & Data Science', av: 'RJ' },
                    { email: 'prof.sarah@faculty.com', name: 'Prof. Sarah Vance', dept: 'Cloud & Full-Stack', av: 'SV' },
                  ].map((fac) => (
                    <button key={fac.email} type="button" onClick={() => setSelectedFaculty(fac.email)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center gap-2.5 ${
                        selectedFaculty === fac.email ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">{fac.av}</div>
                      <div>
                        <div className="font-semibold text-gray-900">{fac.name}</div>
                        <div className="text-[10px] text-gray-400">{fac.dept}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={handleSimulateScan} disabled={simulatingFaculty || !sessionToken || isExpired}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer">
                  {simulatingFaculty
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Authorize &amp; Sign In via QR</>}
                </button>
              </div>

              <div className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isExpired || !sessionToken ? 'bg-gray-300' : 'bg-green-500 animate-pulse'}`} />
                {isExpired ? 'Session expired' : !sessionToken ? 'Click Generate QR to start' : 'Listening for scan handshake…'}
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">EduVibe AI • Adaptive Learning Platform</p>
      </div>
    </div>
  );
}
