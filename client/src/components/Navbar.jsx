import React from 'react';
import { useAuth } from '../context/AuthContext';
import LevelBadge from './LevelBadge';
import { Sparkles, BookOpen, LogOut, Clock, GraduationCap, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, quickLogin } = useAuth();

  if (!user) return null;

  const isStudent = user.role === 'student';
  const isFaculty = user.role === 'faculty' || user.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)] group-hover:bg-indigo-700 transition">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg tracking-tight text-purple-300">
                PRIVID
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest hidden sm:block">
                Adaptive Learning Platform
              </span>
            </div>
          </button>

          {/* Student Nav Links */}
          {isStudent && (
            <nav className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'bg-purple-900/30 text-purple-300 border border-indigo-200'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Dashboard
              </button>
              {!user.entranceCompleted && (
                <button
                  type="button"
                  onClick={() => setActiveTab('entrance-exam')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'entrance-exam'
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-400 bg-purple-900/30 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Diagnostic Exam
                </button>
              )}
            </nav>
          )}

          {/* Faculty Nav */}
          {isFaculty && (
            <nav className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'bg-purple-900/30 text-purple-300 border border-indigo-200'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                Faculty Portal
              </button>
            </nav>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Quick Role Switcher */}
            <div className="hidden lg:flex items-center gap-0.5 bg-gray-100 p-1 rounded-xl border border-gray-800 text-xs">
              <span className="text-gray-400 px-1.5 font-medium text-[10px] uppercase tracking-wider">Switch:</span>
              <button
                type="button"
                onClick={() => quickLogin('student')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-semibold flex items-center gap-1 ${
                  user.role === 'student'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                Student
              </button>
              <button
                type="button"
                onClick={() => quickLogin('faculty')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-semibold flex items-center gap-1 ${
                  user.role === 'faculty'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Faculty
              </button>
            </div>

            {/* User Avatar / Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              {isStudent && user.currentLevel && (
                <LevelBadge level={user.currentLevel} size="sm" />
              )}
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-200 leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[10px] text-gray-400 capitalize flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {user.role === 'faculty' ? 'Faculty Member' : user.role}
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
