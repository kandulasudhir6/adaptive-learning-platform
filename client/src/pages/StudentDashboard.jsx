import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LevelBadge from '../components/LevelBadge';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Award,
  Play,
  Send,
  Hourglass,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function StudentDashboard({ onOpenExam, onOpenModule, onOpenPeriodicExam }) {
  const { user, refreshUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [user?.entranceCompleted, user?.currentLevel]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const coursesRes = await api.courses.list();
      if (coursesRes.courses && coursesRes.courses.length > 0) {
        setCourses(coursesRes.courses);
        const primary = coursesRes.courses[0];
        setSelectedCourse(primary);
        await loadCourseContent(primary.id);
      }
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCourseContent(courseId) {
    try {
      const contentRes = await api.courses.getContent(courseId);
      if (contentRes.success) {
        setModules(contentRes.modules);
      }
    } catch (err) {
      console.error('Error loading course modules:', err);
    }
  }

  const handleRequestAccess = async (moduleId) => {
    setRequestingId(moduleId);
    try {
      const res = await api.exams.requestAccess(moduleId);
      if (res.success) {
        setNotice({
          type: 'success',
          message: 'Periodic test request sent to your mentor for review! Check back shortly.',
        });
        if (selectedCourse) {
          await loadCourseContent(selectedCourse.id);
        }
      }
    } catch (err) {
      setNotice({
        type: 'error',
        message: err.message || 'Failed to request test access.',
      });
    } finally {
      setRequestingId(null);
    }
  };

  const entrancePending = !user?.entranceCompleted;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Banner Notice */}
      {notice && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {notice.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notice.message}
          </div>
          <button onClick={() => setNotice(null)} className="text-xs hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Student Profile & Placement Status Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Student Portal
              </span>
              <LevelBadge level={user?.currentLevel} size="md" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your curriculum adapts continuously based on diagnostic and mentor-reviewed periodic tests.
            </p>
          </div>

          {/* Mentor & Faculty Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:min-w-[420px]">
            <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20">
                M
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Assigned Mentor
                </div>
                <div className="text-sm font-bold text-white">
                  {user?.mentor || 'Prof. Sarah Jenkins'}
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/20">
                F
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Assigned Faculty
                </div>
                <div className="text-sm font-bold text-white">
                  {user?.faculty || 'Dr. Robert Vance'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ DIAGNOSTIC EXAM CALLOUT (If not yet completed) */}
      {entrancePending && (
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Adaptive Placement Required
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Take the MAPS Diagnostic Entrance Exam
              </h2>
              <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                Before unlocking course modules, complete the 15-question Multi-Tiered Adaptive Pool Sampling (MAPS) test.
                Your performance automatically determines whether you start at <strong className="text-emerald-400">Beginner</strong>, bypass to <strong className="text-blue-400">Intermediate</strong>, or advance directly to <strong className="text-purple-400">Advanced</strong>.
              </p>
            </div>

            <button
              onClick={onOpenExam}
              className="px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/40 flex items-center gap-2 text-sm transition transform hover:-translate-y-0.5 flex-shrink-0"
            >
              Start Diagnostic Exam Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Course Curriculum & Modules */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Course Curriculum
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Modules are unlocked according to your placement tier and verified via periodic evaluations.
            </p>
          </div>

          {courses.length > 1 && (
            <select
              value={selectedCourse?.id}
              onChange={(e) => {
                const c = courses.find((x) => x.id === e.target.value);
                setSelectedCourse(c);
                if (c) loadCourseContent(c.id);
              }}
              className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3.5 py-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Modules List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading course modules...</div>
        ) : (
          <div className="space-y-4">
            {modules.map((mod) => {
              const hours = Math.floor(mod.time_spent_minutes / 60);
              const mins = mod.time_spent_minutes % 60;
              const formattedTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              const recHours = Math.floor(mod.study_time_recommended / 60);

              return (
                <div
                  key={mod.id}
                  className={`bg-slate-900/90 border rounded-2xl p-5 sm:p-6 transition-all ${
                    mod.isUnlocked
                      ? 'border-slate-800 hover:border-slate-700 shadow-md'
                      : 'border-slate-800/40 opacity-60 bg-slate-950/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Module Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <LevelBadge level={mod.level} size="sm" />

                        {mod.isBypassed && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            Bypassed by Placement
                          </span>
                        )}

                        {mod.request_status === 'approved' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Mentor Approved for Test
                          </span>
                        )}

                        {mod.request_status === 'pending' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                            <Hourglass className="w-3 h-3" />
                            Pending Mentor Review
                          </span>
                        )}

                        {mod.request_status === 'rejected' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Needs Review
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white">{mod.title}</h3>

                      {/* Rejection feedback note if present */}
                      {mod.request_status === 'rejected' && mod.rejection_reason && (
                        <div className="mt-2 text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                          <strong>Mentor Feedback:</strong> {mod.rejection_reason}
                        </div>
                      )}

                      {/* Progress & Time Metric */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          Time Spent: <strong className="text-slate-200">{formattedTime}</strong>
                          <span className="text-slate-500">(Rec: {recHours}h)</span>
                        </span>

                        {mod.is_completed && (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Content Studied
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons based on State Machine */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Study Content Button */}
                      {mod.isUnlocked ? (
                        <button
                          onClick={() => onOpenModule(mod.id)}
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Study Content
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 bg-slate-950 border border-slate-800 flex items-center gap-1.5 cursor-not-allowed"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Locked
                        </button>
                      )}

                      {/* Periodic Test Buttons */}
                      {mod.isUnlocked && !mod.isBypassed && (
                        <>
                          {mod.request_status === 'approved' ? (
                            /* Approved -> START TEST UNLOCKED */
                            <button
                              onClick={() => onOpenPeriodicExam(mod.id)}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Start Periodic Test
                            </button>
                          ) : mod.request_status === 'pending' ? (
                            /* Pending Mentor Approval */
                            <button
                              disabled
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 cursor-wait"
                            >
                              <Hourglass className="w-3.5 h-3.5 animate-spin" />
                              Pending Approval
                            </button>
                          ) : (
                            /* Request Access from Mentor */
                            <button
                              onClick={() => handleRequestAccess(mod.id)}
                              disabled={requestingId === mod.id}
                              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-1.5 transition disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {requestingId === mod.id ? 'Requesting...' : 'Request Test Access'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
