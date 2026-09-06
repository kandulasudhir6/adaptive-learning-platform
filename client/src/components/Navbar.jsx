import React from 'react';
import { useAuth } from '../context/AuthContext';
import LevelBadge from './LevelBadge';
import { BookOpen, User, LogOut, CheckCircle, Clock, Users, Database } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, quickLogin } = useAuth();

  if (!user) return null;

  const isStudent = user.role === 'student';
  const isMentorOrFaculty = user.role === 'mentor' || user.role === 'faculty' || user.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AdaptLearn
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-semibold tracking-wider">
                MAPS Engine
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isStudent && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  My Curriculum
                </button>
                {!user.entranceCompleted && (
                  <button
                    onClick={() => setActiveTab('entrance-exam')}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      activeTab === 'entrance-exam'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Diagnostic Exam
                  </button>
                )}
              </>
            )}

            {isMentorOrFaculty && (
              <>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'requests'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  Pending Requests
                </button>
                <button
                  onClick={() => setActiveTab('roster')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'roster'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  Student Roster
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    activeTab === 'questions'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Database className="w-4 h-4 text-purple-400" />
                  Question Bank
                </button>
              </>
            )}
          </nav>

          {/* User Profile, Role Badge & Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Persona Switcher for effortless testing */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 px-1.5 font-medium">Switch Role:</span>
              <button
                onClick={() => quickLogin('student')}
                title="Login as Student (Alex Rivera)"
                className={`px-2 py-1 rounded transition ${
                  user.email === 'alex@student.com'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => quickLogin('mentor')}
                title="Login as Mentor (Prof. Sarah Jenkins)"
                className={`px-2 py-1 rounded transition ${
                  user.email === 'prof.sarah@mentor.com'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mentor
              </button>
              <button
                onClick={() => quickLogin('faculty')}
                title="Login as Faculty (Dr. Robert Vance)"
                className={`px-2 py-1 rounded transition ${
                  user.email === 'dr.jenkins@faculty.com'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Faculty
              </button>
            </div>

            {/* Current user badge & level */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              {isStudent && user.currentLevel && (
                <LevelBadge level={user.currentLevel} size="sm" />
              )}
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-200 leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-slate-400 capitalize flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {user.role}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
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
