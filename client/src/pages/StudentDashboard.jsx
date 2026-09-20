import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LevelBadge from '../components/LevelBadge';
import RoadmapViewer from '../components/RoadmapViewer';
import StudentSettings from '../components/StudentSettings';
import {
  BookOpen, CheckCircle2, Lock, ArrowRight, AlertCircle, Award,
  Play, Hourglass, HelpCircle, Sparkles, Map, BookMarked, UserCheck, Loader2, Settings, Shield, LayoutDashboard, LineChart
} from 'lucide-react';

export default function StudentDashboard({ onOpenExam, onOpenModule, onOpenPeriodicExam }) {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  useEffect(() => { loadDashboardData(); }, [user?.entranceCompleted, user?.currentLevel]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [coursesRes, facultiesRes] = await Promise.all([
        api.courses.list(),
        api.courses.getFaculties().catch(() => ({ faculties: [] })),
      ]);
      if (coursesRes.courses?.length > 0) {
        setCourses(coursesRes.courses);
        let primary = null;
        if (user?.enrolledCourse?.course_id) {
          primary = coursesRes.courses.find(c => c.id == user.enrolledCourse.course_id);
        }
        if (!primary) {
          primary = coursesRes.courses[0];
        }
        setSelectedCourse(primary);
        await loadCourseContent(primary.id);
      }
      if (facultiesRes.faculties) {
        setFaculties(facultiesRes.faculties);
        if (facultiesRes.faculties.length > 0) setSelectedFacultyId(facultiesRes.faculties[0].id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function loadCourseContent(courseId) {
    try {
      const contentRes = await api.courses.getContent(courseId);
      if (contentRes.success) setModules(contentRes.modules);
    } catch (err) { console.error(err); }
  }

  async function loadRoadmap(courseId) {
    setRoadmapLoading(true);
    try {
      const res = await api.courses.getMyRoadmap(courseId);
      setRoadmap(res.success && res.roadmap ? res.roadmap : null);
    } catch (err) { setRoadmap(null); }
    finally { setRoadmapLoading(false); }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'roadmap' && selectedCourse && !roadmap) loadRoadmap(selectedCourse.id);
  };

  const handleEnroll = async () => {
    if (!selectedCourse || !selectedFacultyId) return;
    setEnrolling(true);
    try {
      const res = await api.courses.enroll(selectedCourse.id, selectedFacultyId);
      if (res.success) { setEnrollSuccess(true); await refreshUser(); }
      else setNotice({ type: 'error', message: res.error || 'Enrollment failed.' });
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
    finally { setEnrolling(false); }
  };

  const handleRequestAccess = async (moduleId) => {
    setRequestingId(moduleId);
    try {
      const res = await api.exams.requestAccess(moduleId);
      if (res.success) {
        setNotice({ type: 'success', message: 'Test request sent to faculty!' });
        if (selectedCourse) await loadCourseContent(selectedCourse.id);
      }
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
    finally { setRequestingId(null); }
  };

  if (loading) return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses & Modules', icon: BookMarked },
    { id: 'roadmap', label: 'My Roadmap', icon: Map },
    { id: 'diagnostic', label: 'Diagnostic Exams', icon: Sparkles },
    { id: 'progress', label: 'Progress Analytics', icon: LineChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-gray-950 text-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarLinks.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === id 
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {notice && (
          <div className="m-4 p-4 rounded-xl flex items-center justify-between gap-4 bg-gray-900 border border-gray-800">
            <div className={`flex items-center gap-2 font-bold ${notice.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
              <AlertCircle className="w-5 h-5" />
              {notice.message}
            </div>
            <button onClick={() => setNotice(null)} className="text-gray-500 hover:text-gray-300">-</button>
          </div>
        )}

        
            {!user?.enrolledCourse ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden border border-indigo-500/30">
                  <div className="relative z-10 max-w-xl">
                    <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-1">Student Portal</p>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-100">Welcome, {user?.firstName}</h1>
                    <p className="text-gray-400 mt-2">Before you begin, please enroll in a course.</p>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center mt-6 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <h2 className="text-2xl font-bold text-white mb-4">Enroll in a Course to Begin</h2>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">Select a course and a faculty mentor to start your adaptive learning journey.</p>
                  <div className="max-w-md mx-auto space-y-4">
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 font-bold focus:outline-none focus:border-indigo-500"
                      value={selectedCourse?.id || ''}
                      onChange={(e) => {
                        const c = courses.find(course => course.id === e.target.value);
                        if (c) { setSelectedCourse(c); loadCourseContent(c.id); }
                      }}
                    >
                      <option value="" disabled>Select Course...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 font-bold focus:outline-none focus:border-indigo-500"
                      value={selectedFacultyId || ''}
                      onChange={(e) => setSelectedFacultyId(e.target.value)}
                    >
                      <option value="" disabled>Select Mentor...</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>Dr. {f.first_name} {f.last_name}</option>)}
                    </select>
                    
                    <button 
                      onClick={handleEnroll}
                      disabled={enrolling || !selectedCourse || !selectedFacultyId}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
                    >
                      {enrolling ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
{/* Hero Banner (Only on Dashboard) */}
        {activeTab === 'dashboard' && (
          <div className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-6xl mx-auto px-6 py-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-1">Student Portal</p>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-100">Welcome back, {user?.firstName}</h1>
                  <p className="text-gray-400 mt-2">{selectedCourse?.title || 'Your adaptive learning journey awaits.'}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <LevelBadge level={user?.currentLevel || 'beginner'} />
                  {user?.entranceCompleted && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" />Diagnostic Passed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 max-w-6xl w-full mx-auto p-6 pb-16">
          
          {/* DASHBOARD TAB (HOME) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {!user?.entranceCompleted ? (
                <div className="bg-purple-900/30 border border-indigo-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-100">Diagnostic Exam Required</h3>
                      <p className="text-gray-400 mt-1">Complete the AI-powered entrance test to unlock your personalized learning roadmap.</p>
                    </div>
                  </div>
                  <button onClick={onOpenExam}
                    className="shrink-0 flex items-center gap-2 px-6 py-3 font-bold text-white bg-purple-600 hover:bg-indigo-700 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)] transition cursor-pointer">
                    <Sparkles className="w-5 h-5" />Start Exam<ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-purple-400 mb-4"><Map className="w-6 h-6" /><h3 className="font-bold text-lg">Current Module</h3></div>
                    <div className="text-2xl font-black text-gray-100 mb-1">{modules.find(m => m.isUnlocked && !m.is_completed)?.title || 'All Completed!'}</div>
                    <button onClick={() => handleTabChange('courses')} className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold mt-4">Continue Learning &rarr;</button>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-green-400 mb-4"><Award className="w-6 h-6" /><h3 className="font-bold text-lg">Milestones</h3></div>
                    <div className="text-2xl font-black text-gray-100 mb-1">{modules.filter(m => m.is_completed).length} / {modules.length}</div>
                    <div className="text-sm text-gray-400">Modules Completed</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 text-amber-400 mb-4"><Hourglass className="w-6 h-6" /><h3 className="font-bold text-lg">Time Spent</h3></div>
                    <div className="text-2xl font-black text-gray-100 mb-1">{modules.reduce((acc, m) => acc + (m.time_spent_minutes || 0), 0)} min</div>
                    <div className="text-sm text-gray-400">Total Study Time</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DIAGNOSTIC EXAMS TAB */}
          {activeTab === 'diagnostic' && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-black text-gray-100 mb-6 flex items-center gap-3"><Sparkles className="w-6 h-6 text-indigo-500" />Diagnostic Exams</h3>
              {!user?.entranceCompleted ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
                  <p className="text-gray-400">You need to take your initial diagnostic exam. This AI-powered test evaluates your current knowledge level and generates a custom syllabus specifically for you.</p>
                  <button onClick={onOpenExam} className="w-full flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-purple-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer">
                    <Sparkles className="w-5 h-5" /> Launch Diagnostic Exam
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-green-900/20 border border-green-500/30 text-green-400 flex items-start gap-4">
                  <CheckCircle2 className="w-8 h-8 shrink-0" />
                  <div>
                    <div className="text-lg font-bold text-green-300 mb-1">Diagnostic Passed!</div>
                    <p className="text-green-200/70 text-sm">You have already completed the entrance exam and placed into the <strong>{user?.currentLevel?.toUpperCase() || 'BEGINNER'}</strong> tier. Your personalized roadmap is active.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROGRESS ANALYTICS TAB */}
          {activeTab === 'progress' && (
            <div className="max-w-3xl">
              <h3 className="text-2xl font-black text-gray-100 mb-6 flex items-center gap-3"><LineChart className="w-6 h-6 text-indigo-500" />Progress Analytics</h3>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <LineChart className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-300 mb-2">Analytics Engine</h4>
                <p className="text-gray-500">Advanced performance analytics, time-tracking, and skill mastery charts will appear here as you progress through your modules.</p>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <StudentSettings courses={courses} selectedCourse={selectedCourse} onCourseChange={(c) => {
              setSelectedCourse(c);
              loadCourseContent(c.id);
            }} />
          )}

          {/* COURSES & MODULES TAB */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-2xl font-black text-gray-100 flex items-center gap-3"><BookOpen className="w-6 h-6 text-indigo-500" />Course Modules</h3>
                
                {/* Fallback Course Selector if no Enroll tab */}
                {!user?.enrolledCourse && (
                  <select 
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm font-bold focus:outline-none focus:border-indigo-500"
                    value={selectedCourse?.id || ''}
                    onChange={(e) => {
                      const c = courses.find(course => course.id === e.target.value);
                      if (c) { setSelectedCourse(c); loadCourseContent(c.id); }
                    }}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {!user?.entranceCompleted ? (
                <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="font-bold text-lg text-gray-300">Modules Locked</p>
                  <p className="text-sm mt-1">Complete the diagnostic exam to unlock your customized syllabus.</p>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                  <p>No modules available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {modules.map((mod, idx) => {
                    const isUnlocked = mod.isUnlocked;
                    const isCompleted = mod.is_completed;
                    const testApproved = mod.request_status === 'approved';
                    const testRequested = mod.request_status === 'pending';
                    const canTakeTest = testApproved && !isCompleted;

                    return (
                      <div key={mod.id} className={`bg-gray-900 border rounded-2xl p-6 shadow-lg transition-all ${isUnlocked ? 'border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800/50' : 'border-gray-800 opacity-60'}`}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
                              isCompleted ? 'bg-green-500/20 text-green-400' :
                              isUnlocked ? 'bg-purple-900/50 text-purple-400 border border-purple-500/30' :
                              'bg-gray-800 text-gray-500'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{mod.level} TIER</div>
                              <h4 className="font-bold text-gray-100 leading-tight">{mod.title}</h4>
                            </div>
                          </div>
                          {isUnlocked ? (
                            isCompleted ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" /> : null
                          ) : <Lock className="w-5 h-5 text-gray-600 shrink-0 mt-1" />}
                        </div>

                        {/* Progress Bar (Time Spent vs Recommended) */}
                        {isUnlocked && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-400 font-medium mb-1.5">
                              <span>Study Time</span>
                              <span>{mod.time_spent_minutes || 0} / {mod.study_time_recommended || 60} min</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, ((mod.time_spent_minutes || 0) / (mod.study_time_recommended || 60)) * 100)}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            disabled={!isUnlocked}
                            onClick={() => onOpenModule(mod.id)}
                            className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Play className="w-4 h-4" /> {isCompleted ? 'Review' : 'Study'}
                          </button>

                          {isUnlocked && !isCompleted && !testRequested && !testApproved && (
                            <button
                              onClick={() => handleRequestAccess(mod.id)}
                              disabled={requestingId === mod.id}
                              className="px-4 py-2.5 rounded-xl font-bold text-sm bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 border border-purple-500/30 transition disabled:opacity-50 flex items-center justify-center"
                              title="Request Test Access"
                            >
                              {requestingId === mod.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                            </button>
                          )}

                          {testRequested && (
                            <button disabled className="px-4 py-2.5 rounded-xl font-bold text-sm bg-amber-900/20 text-amber-500 border border-amber-500/20 flex items-center justify-center gap-1.5">
                              <Hourglass className="w-4 h-4" /> Pending
                            </button>
                          )}

                          {canTakeTest && (
                            <button
                              onClick={() => onOpenPeriodicExam(mod.id)}
                              className="px-4 py-2.5 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-500 text-white transition flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                            >
                              <Play className="w-4 h-4" /> Start Test
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ROADMAP TAB */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-gray-100 mb-6 flex items-center gap-3"><Map className="w-6 h-6 text-indigo-500" />My Learning Roadmap</h3>
              {!user?.entranceCompleted ? (
                <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <Map className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-400">Complete the entrance exam to generate your AI roadmap</p>
                </div>
              ) : roadmapLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
              ) : roadmap ? (
                <RoadmapViewer roadmap={roadmap} />
              ) : (
                <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>Roadmap not available.</p>
                </div>
              )}
            </div>
          )}

        </div>
      
              </>
            )}
  
        </main>

    </div>
  );
}
