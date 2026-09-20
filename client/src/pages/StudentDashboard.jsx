import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LevelBadge from '../components/LevelBadge';
import RoadmapViewer from '../components/RoadmapViewer';
import {
  BookOpen, CheckCircle2, Lock, ArrowRight, AlertCircle, Award,
  Play, Hourglass, HelpCircle, Sparkles, Map, BookMarked, UserCheck, Loader2,
} from 'lucide-react';

export default function StudentDashboard({ onOpenExam, onOpenModule, onOpenPeriodicExam }) {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
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
        const primary = coursesRes.courses[0];
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Banner */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-1">Student Portal</p>
              <h1 className="text-2xl md:text-3xl font-black text-gray-100">Welcome back, {user?.firstName} 👋</h1>
              <p className="text-gray-400 text-sm mt-1">{selectedCourse?.title || 'Your adaptive learning journey.'}</p>
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

      {/* Entrance Exam CTA */}
      {!user?.entranceCompleted && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="bg-purple-900/30 border border-indigo-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-100">Mandatory Diagnostic Exam Required</h3>
                <p className="text-sm text-gray-400 mt-0.5">Complete the AI-powered entrance test to unlock your personalized learning roadmap.</p>
              </div>
            </div>
            <button onClick={onOpenExam}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-indigo-700 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.1)] transition cursor-pointer">
              <Sparkles className="w-4 h-4" />Start Diagnostic Exam<ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notice */}
      {notice && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className={`flex items-center gap-2.5 p-4 rounded-xl border text-sm ${
            notice.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {notice.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            {notice.message}
            <button className="ml-auto text-xs opacity-60 hover:opacity-100 cursor-pointer" onClick={() => setNotice(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 p-1 rounded-xl w-fit shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          {[
            { id: 'courses', label: 'Courses & Modules', icon: BookMarked },
            { id: 'roadmap', label: 'My Roadmap', icon: Map },
            { id: 'enroll', label: 'Enroll & Mentor', icon: UserCheck },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => handleTabChange(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === id ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-100'
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-16">

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500" />Course Modules</h3>
            {!user?.entranceCompleted ? (
              <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <Lock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-400">Complete the entrance exam to unlock modules</p>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>No modules available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((mod, idx) => {
                  const isUnlocked = mod.progress?.isUnlocked ?? (idx === 0);
                  const isCompleted = mod.progress?.moduleCompleted;
                  const testApproved = mod.progress?.periodicTestApproved;
                  const testRequested = mod.progress?.periodicTestRequested;
                  const canTakeTest = testApproved && !isCompleted;
                  return (
                    <div key={mod.id} className={`bg-gray-900 border rounded-2xl p-5 shadow-[0_0_15px_rgba(168,85,247,0.1)] transition ${isUnlocked ? 'border-gray-800 hover:border-gray-300' : 'border-gray-800 opacity-60'}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                            isCompleted ? 'bg-green-50 text-green-600 border border-green-200' :
                            isUnlocked ? 'bg-purple-900/30 text-purple-400 border border-indigo-200' : 'bg-gray-100 text-gray-400'
                          }`}>{isCompleted ? '✓' : idx + 1}</div>
                          <div>
                            <h4 className="font-bold text-gray-100 text-sm">{mod.title}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
                          </div>
                        </div>
                        {isUnlocked ? isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : null : <Lock className="w-4 h-4 text-gray-300 shrink-0 mt-1" />}
                      </div>
                      {isUnlocked && mod.progress && (
                        <div className="mb-3">
                          <div className="flex justify-between text-[11px] text-gray-400 mb-1"><span>Progress</span><span>{mod.progress.studyPercentage ?? 0}%</span></div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${mod.progress.studyPercentage ?? 0}%` }} />
                          </div>
                        </div>
                      )}
                      {isUnlocked && (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => onOpenModule(mod.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-900/30 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer">
                            <Play className="w-3.5 h-3.5" />Study Module
                          </button>
                          {canTakeTest && (
                            <button type="button" onClick={() => onOpenPeriodicExam(mod.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition cursor-pointer">
                              <Award className="w-3.5 h-3.5" />Take Weekly Test
                            </button>
                          )}
                          {!testRequested && !testApproved && !isCompleted && (
                            <button type="button" onClick={() => handleRequestAccess(mod.id)} disabled={requestingId === mod.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition disabled:opacity-50 cursor-pointer">
                              <HelpCircle className="w-3.5 h-3.5" />{requestingId === mod.id ? 'Requesting…' : 'Request Test Access'}
                            </button>
                          )}
                          {testRequested && !testApproved && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-800 rounded-xl">
                              <Hourglass className="w-3.5 h-3.5 text-amber-500" />Pending Faculty Approval
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ROADMAP TAB */}
        {activeTab === 'roadmap' && (
          <div>
            {!user?.entranceCompleted ? (
              <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <Lock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400 font-medium">Complete the entrance exam to generate your AI roadmap.</p>
                <button onClick={onOpenExam} className="mt-4 px-4 py-2 bg-purple-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition cursor-pointer">Start Diagnostic Exam</button>
              </div>
            ) : roadmapLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-3"><Loader2 className="w-6 h-6 animate-spin" />Loading roadmap…</div>
            ) : (
              <RoadmapViewer roadmap={roadmap} courseTitle={selectedCourse?.title} facultyName={user?.assignedFacultyName} />
            )}
          </div>
        )}

        {/* ENROLL TAB */}
        {activeTab === 'enroll' && (
          <div className="max-w-xl">
            <h3 className="text-lg font-bold text-gray-100 mb-2 flex items-center gap-2"><UserCheck className="w-5 h-5 text-indigo-500" />Enrollment & Mentor Selection</h3>
            <p className="text-sm text-gray-400 mb-6">Select your course and choose a faculty mentor to guide your learning journey.</p>
            {enrollSuccess || user?.enrolledCourse ? (
              <div className="p-5 rounded-2xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                <div><div className="font-bold">Enrollment Confirmed!</div><div className="text-sm text-green-600">You are enrolled in {user?.enrolledCourse?.course_title || 'this course'} and mentored by Dr. {user?.enrolledCourse?.faculty_first_name || 'your faculty'}.</div></div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Selected Course</label>
                  <div className="px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 text-sm font-medium">{selectedCourse?.title || 'No course available'}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Choose Faculty Mentor</label>
                  <div className="space-y-2">
                    {faculties.map((fac) => (
                      <button key={fac.id} type="button" onClick={() => setSelectedFacultyId(fac.id)}
                        className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                          selectedFacultyId === fac.id ? 'border-indigo-400 bg-purple-900/30 ring-1 ring-indigo-300' : 'border-gray-800 bg-gray-900 hover:border-gray-300 hover:bg-gray-950'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-purple-300 text-xs font-black flex items-center justify-center border border-indigo-200">
                            {(fac.firstName || 'F')[0]}{(fac.lastName || 'M')[0]}
                          </div>
                          <div>
                            <div className="font-bold text-gray-100 text-sm">{fac.firstName} {fac.lastName}</div>
                            <div className="text-xs text-gray-400">{fac.email}</div>
                            {fac.subjects?.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {fac.subjects.slice(0, 3).map((s, i) => (
                                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 border border-gray-800">{s.subject_name}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={handleEnroll} disabled={enrolling || !selectedFacultyId}
                  className="w-full py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(168,85,247,0.1)] transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm">
                  {enrolling ? <><Loader2 className="w-4 h-4 animate-spin" />Enrolling…</> : <><CheckCircle2 className="w-4 h-4" />Confirm Enrollment</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
