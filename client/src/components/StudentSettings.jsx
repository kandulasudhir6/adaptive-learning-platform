import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Moon, Bell, Save, CheckCircle2, BookOpen } from 'lucide-react';

export default function StudentSettings({ courses, selectedCourse, onCourseChange }) {
  const { user } = useAuth();
  const [successMsg, setSuccessMsg] = useState('');
  
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState({
    email: true,
    progress: true,
    roadmap: true
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSuccessMsg('Profile updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {successMsg && (
        <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-200 flex items-center gap-3 font-medium">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          {successMsg}
        </div>
      )}

      {/* Profile Management */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        <h3 className="text-lg font-bold text-gray-100 mb-6 flex items-center gap-2"><User className="w-5 h-5 text-indigo-500" />Profile Management</h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">First Name</label>
              <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-indigo-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Last Name</label>
              <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-indigo-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-gray-100 focus:outline-none focus:border-indigo-500 transition" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 transition cursor-pointer">
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </form>
      </div>

      {/* Active Course Switcher */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500" />Active Course Switcher</h3>
        <p className="text-sm text-gray-400 mb-4">Toggle between your enrolled courses to adjust your primary dashboard focus.</p>
        <select 
          value={selectedCourse?.id || ''} 
          onChange={(e) => {
            const c = courses.find(course => course.id === e.target.value);
            if(c) onCourseChange(c);
          }}
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-indigo-500 transition"
        >
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Preferences & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2"><Moon className="w-5 h-5 text-indigo-500" />Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Platform Theme</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500">
                <option value="dark">Dark Mode (Cyberpunk)</option>
                <option value="light">Light Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><Bell className="w-4 h-4" />Notifications</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} className="rounded bg-gray-950 border-gray-800 text-purple-600 focus:ring-purple-500" />
                  Email Updates
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={notifications.progress} onChange={(e) => setNotifications({...notifications, progress: e.target.checked})} className="rounded bg-gray-950 border-gray-800 text-purple-600 focus:ring-purple-500" />
                  Progress Milestones
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-indigo-500" />Security</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSuccessMsg('Password updated!'); setTimeout(() => setSuccessMsg(''), 3000); }}>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Current Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">New Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition cursor-pointer">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
