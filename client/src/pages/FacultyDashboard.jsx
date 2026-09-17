import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import RoadmapViewer from '../components/RoadmapViewer';
import LevelBadge from '../components/LevelBadge';
import {
  Users, BookOpen, Upload, CheckCircle2, XCircle, AlertCircle, Clock,
  LogIn, Calendar, Map, Loader2, Edit3, Save, ChevronDown, ChevronUp,
  BookMarked, Award, Brain, Trash2, Plus, RefreshCw, BarChart3,
  Activity, User, Shield, FileEdit,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// NOTICE BANNER
// ─────────────────────────────────────────────────────────────────────────────
function Notice({ notice, onClose }) {
  if (!notice) return null;
  return (
    <div className="max-w-6xl mx-auto px-4 mt-4">
      <div className={`flex items-center gap-2.5 p-4 rounded-xl border text-sm ${
        notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}>
        {notice.type === 'success'
          ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          : <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
        }
        <span>{notice.message}</span>
        <button className="ml-auto text-xs opacity-60 hover:opacity-100 cursor-pointer" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT DETAIL PANEL (inside expanded row)
// ─────────────────────────────────────────────────────────────────────────────
function StudentDetailPanel({ student, facultyName, onNotice }) {
  const studentId = student.id || student.student_id;
  const [logins, setLogins] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loadingLogins, setLoadingLogins] = useState(true);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [editingRoadmap, setEditingRoadmap] = useState(false);
  const [facultyNotes, setFacultyNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState('profile'); // 'profile' | 'logins' | 'roadmap'

  useEffect(() => {
    // Load logins
    api.faculty.getStudentLogins(studentId)
      .then((res) => setLogins(res.logs || []))
      .catch(() => setLogins([]))
      .finally(() => setLoadingLogins(false));

    // Load roadmap
    api.faculty.getStudentRoadmap(studentId)
      .then((res) => setRoadmap(res.roadmap || null))
      .catch(() => setRoadmap(null))
      .finally(() => setLoadingRoadmap(false));
  }, [studentId]);

  const handleRoadmapSave = async (action) => {
    if (!roadmap) return;
    setSaving(true);
    try {
      const res = await api.faculty.updateStudentRoadmap(roadmap.id, { action, facultyNotes, status: action === 'approve' ? 'approved' : 'active' });
      if (res.success) {
        onNotice({ type: 'success', message: action === 'approve' ? '✓ Roadmap approved and released to student!' : '✓ Notes saved successfully.' });
        setRoadmap((r) => ({ ...r, faculty_notes: facultyNotes, status: action === 'approve' ? 'approved' : r.status }));
        setEditingRoadmap(false);
      } else {
        onNotice({ type: 'error', message: res.error || 'Failed to update roadmap.' });
      }
    } catch (err) {
      onNotice({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const panelBtnClass = (id) =>
    `px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
      activePanel === id ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-indigo-300 hover:text-purple-300'
    }`;

  return (
    <div className="border-t border-gray-800 bg-gray-950/60">
      {/* Panel Switcher */}
      <div className="flex gap-2 p-4 pb-0 flex-wrap">
        <button className={panelBtnClass('profile')} onClick={() => setActivePanel('profile')}>
          <User className="w-3.5 h-3.5" /> Profile
        </button>
        <button className={panelBtnClass('logins')} onClick={() => setActivePanel('logins')}>
          <Activity className="w-3.5 h-3.5" /> Login Activity {logins && <span className="ml-1 bg-gray-900/20 px-1 rounded text-[10px]">{logins.length}</span>}
        </button>
        <button className={panelBtnClass('roadmap')} onClick={() => setActivePanel('roadmap')}>
          <Map className="w-3.5 h-3.5" /> Roadmap Review
          {roadmap?.status === 'pending_approval' && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* ── PROFILE PANEL ── */}
        {activePanel === 'profile' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Full Name', value: `${student.first_name || student.firstName} ${student.last_name || student.lastName}` },
              { label: 'Email', value: student.email },
              { label: 'Course', value: student.course_title || 'Not Enrolled' },
              { label: 'Current Level', value: <LevelBadge level={student.current_level} /> },
              { label: 'Entrance Exam', value: student.entrance_completed ? <span className="text-emerald-600 font-semibold text-xs">✓ Completed</span> : <span className="text-amber-600 text-xs">Pending</span> },
              { label: 'Entrance Score', value: student.entrance_score != null ? `${student.entrance_score}%` : '—' },
              { label: 'Modules Completed', value: student.completed_modules ?? '—' },
              { label: 'Total Logins', value: student.total_logins ?? '—' },
              { label: 'Last Login', value: student.last_login_time ? new Date(student.last_login_time).toLocaleString() : 'Never' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</div>
                <div className="text-sm text-gray-100 font-medium">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── LOGIN ACTIVITY PANEL ── */}
        {activePanel === 'logins' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" /> Day-to-Day Login Timeline
              </h4>
              {logins && <span className="text-xs text-gray-400">{logins.length} records</span>}
            </div>
            {loadingLogins ? (
              <div className="flex items-center gap-2 text-gray-400 text-xs py-4">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> Loading login history…
              </div>
            ) : logins?.length === 0 ? (
              <div className="text-center py-8 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 text-sm">No login records found.</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {logins.map((log, i) => {
                  const ts = log.login_time || log.login_at || log.created_at;
                  const d = ts ? new Date(ts) : null;
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs p-3 rounded-xl bg-gray-900 border border-gray-800 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-indigo-200 transition">
                      <div className="w-7 h-7 rounded-lg bg-purple-900/30 border border-purple-900 flex items-center justify-center text-purple-400 shrink-0">
                        <LogIn className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-200">{d ? d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</div>
                        <div className="text-gray-400">{d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      </div>
                      {log.ip_address && <span className="text-gray-300 font-mono text-[11px] shrink-0">{log.ip_address}</span>}
                      {log.device_info && <span className="text-gray-300 text-[10px] truncate max-w-[120px] hidden sm:block">{log.device_info.split(' ').slice(0, 3).join(' ')}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ROADMAP PANEL ── */}
        {activePanel === 'roadmap' && (
          <div>
            {loadingRoadmap ? (
              <div className="flex items-center gap-2 text-gray-400 text-xs py-4">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> Loading roadmap…
              </div>
            ) : !roadmap ? (
              <div className="text-center py-10 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 space-y-2">
                <Map className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-sm">No roadmap yet — student hasn't completed the entrance exam.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Roadmap Status Bar */}
                <div className="flex items-center gap-3 flex-wrap p-4 bg-gray-900 border border-gray-800 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                    roadmap.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {roadmap.status === 'approved' ? '✓ Approved' : '⏳ Pending Your Approval'}
                  </span>
                  {roadmap.current_level && <LevelBadge level={roadmap.current_level} />}
                  <span className="text-xs text-gray-400 ml-auto">{roadmap.title}</span>
                </div>

                {/* Faculty Notes / Edit Panel */}
                {editingRoadmap ? (
                  <div className="bg-gray-900 border border-indigo-200 rounded-2xl p-5 shadow-[0_0_15px_rgba(168,85,247,0.1)] space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
                      <FileEdit className="w-4 h-4 text-purple-400" /> Review &amp; Customize Roadmap
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Faculty Guidance Notes &amp; Milestone Adjustments
                      </label>
                      <textarea
                        value={facultyNotes}
                        onChange={(e) => setFacultyNotes(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-300 text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition"
                        placeholder="Add milestone customizations, pace adjustments, topic recommendations, or guidance notes for this student…"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => handleRoadmapSave('approve')} disabled={saving}
                        className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Approve &amp; Release to Student'}
                      </button>
                      <button onClick={() => handleRoadmapSave('update')} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-300 bg-gray-900 border border-gray-300 hover:bg-gray-100 rounded-xl transition disabled:opacity-50 cursor-pointer">
                        <Save className="w-3.5 h-3.5" /> Save Notes Only
                      </button>
                      <button onClick={() => setEditingRoadmap(false)}
                        className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 rounded-xl transition cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingRoadmap(true); setFacultyNotes(roadmap.faculty_notes || ''); }}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-300 bg-purple-900/30 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" />
                      {roadmap.status === 'approved' ? 'Edit Notes & Milestones' : 'Review & Approve Roadmap'}
                    </button>
                    {roadmap.status !== 'approved' && (
                      <button onClick={() => handleRoadmapSave('approve')} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Quick Approve
                      </button>
                    )}
                  </div>
                )}

                {roadmap.faculty_notes && (
                  <div className="bg-purple-900/30 border border-purple-900 rounded-xl p-4 text-sm text-indigo-800">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5">Your Faculty Notes</div>
                    <p className="leading-relaxed">{roadmap.faculty_notes}</p>
                  </div>
                )}

                {/* Full Roadmap Preview */}
                <RoadmapViewer roadmap={roadmap} courseTitle={student.course_title} facultyName={facultyName} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC EXAM EDITOR (for faculty)
// ─────────────────────────────────────────────────────────────────────────────
function DiagnosticExamEditor({ onNotice }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'beginner' | 'intermediate' | 'advanced'

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/faculty/diagnostic-questions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('alp_auth_token')}` },
      });
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      onNotice({ type: 'error', message: 'Failed to load diagnostic questions.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQuestions(); }, []);

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditForm({
      questionText: q.question_text,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      correctOption: q.correct_option,
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/faculty/diagnostic-questions/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('alp_auth_token')}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        onNotice({ type: 'success', message: '✓ Question updated successfully.' });
        setEditingId(null);
        setQuestions((qs) => qs.map((q) => q.id === editingId ? { ...q, question_text: editForm.questionText, option_a: editForm.optionA, option_b: editForm.optionB, option_c: editForm.optionC, option_d: editForm.optionD, correct_option: editForm.correctOption } : q));
      } else {
        onNotice({ type: 'error', message: data.error || 'Failed to update question.' });
      }
    } catch (err) {
      onNotice({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === 'all' ? questions : questions.filter((q) => q.difficulty === filter);
  const diffColors = { beginner: 'bg-green-50 text-green-700 border-green-200', intermediate: 'bg-amber-50 text-amber-700 border-amber-200', advanced: 'bg-red-50 text-red-700 border-red-200' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" /> Diagnostic Exam Questions
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{questions.length} questions in question bank — edit, correct, or update any question below</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'beginner', 'intermediate', 'advanced'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer capitalize ${
                filter === f ? 'bg-purple-600 text-white shadow' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-indigo-300'
              }`}>
              {f === 'all' ? `All (${questions.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${questions.filter((q) => q.difficulty === f).length})`}
            </button>
          ))}
          <button onClick={loadQuestions} className="p-2 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-950 text-gray-400 hover:text-gray-200 transition cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" /> Loading questions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <Brain className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-400">No questions found</p>
          <p className="text-xs mt-1">Questions appear here after students take the diagnostic exam.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, idx) => (
            <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.1)] overflow-hidden">
              {editingId === q.id ? (
                // ── EDIT MODE ──
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
                    <FileEdit className="w-4 h-4" /> Editing Question #{idx + 1}
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${diffColors[q.difficulty]}`}>{q.difficulty}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Question Text</label>
                    <textarea rows={3} value={editForm.questionText} onChange={(e) => setEditForm((f) => ({ ...f, questionText: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div key={opt}>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          Option {opt}
                          {editForm.correctOption === opt && <span className="text-emerald-600 text-[10px]">✓ Correct</span>}
                        </label>
                        <div className="flex gap-2">
                          <input value={editForm[`option${opt}`]} onChange={(e) => setEditForm((f) => ({ ...f, [`option${opt}`]: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                          <button onClick={() => setEditForm((f) => ({ ...f, correctOption: opt }))}
                            className={`px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${editForm.correctOption === opt ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-emerald-400'}`}>
                            ✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                      <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 rounded-xl transition cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // ── VIEW MODE ──
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${diffColors[q.difficulty]}`}>{q.difficulty}</span>
                      </div>
                      <p className="text-sm text-gray-100 font-medium mb-3 leading-relaxed">{q.question_text}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                          const text = q[`option_${opt.toLowerCase()}`];
                          const isCorrect = q.correct_option?.toUpperCase() === opt;
                          return text ? (
                            <div key={opt} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${isCorrect ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold' : 'bg-gray-950 border border-gray-800 text-gray-400'}`}>
                              <span className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-900 border border-gray-300 text-gray-400'}`}>{opt}</span>
                              {text} {isCorrect && <span className="ml-auto text-emerald-600">✓</span>}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <button onClick={() => startEdit(q)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-300 bg-purple-900/30 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FACULTY DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function FacultyDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // Subjects tab
  const [subjects, setSubjects] = useState([]);
  const [subjectName, setSubjectName] = useState('');
  const [subjectDescription, setSubjectDescription] = useState('');
  const [uploadingSubject, setUploadingSubject] = useState(false);

  // Requests tab
  const [requests, setRequests] = useState([]);
  const [reviewingId, setReviewingId] = useState(null);

  const showNotice = (n) => { setNotice(n); setTimeout(() => setNotice(null), 4000); };

  useEffect(() => {
    if (activeTab === 'students') loadStudents();
    else if (activeTab === 'subjects') loadSubjects();
    else if (activeTab === 'requests') loadRequests();
  }, [activeTab]);

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await api.faculty.getMyStudents();
      setStudents(res.students || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function loadSubjects() {
    setLoading(true);
    try {
      const res = await api.faculty.getSubjects();
      setSubjects(res.subjects || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await api.faculty.getRequests();
      setRequests(res.requests || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const toggleStudent = (id) => setExpandedStudentId((prev) => prev === id ? null : id);

  const handleUploadSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    setUploadingSubject(true);
    try {
      const res = await api.faculty.uploadSubject({ subjectName, description: subjectDescription });
      if (res.success) {
        showNotice({ type: 'success', message: '✓ Subject published successfully!' });
        setSubjectName(''); setSubjectDescription('');
        await loadSubjects();
      } else showNotice({ type: 'error', message: res.error || 'Failed.' });
    } catch (err) { showNotice({ type: 'error', message: err.message }); }
    finally { setUploadingSubject(false); }
  };

  const handleReviewRequest = async (requestId, status) => {
    setReviewingId(requestId);
    try {
      const res = await api.faculty.reviewRequest(requestId, { status });
      if (res.success) {
        showNotice({ type: 'success', message: `✓ Request ${status}.` });
        await loadRequests();
      }
    } catch (err) { showNotice({ type: 'error', message: err.message }); }
    finally { setReviewingId(null); }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const tabs = [
    { id: 'students', label: 'My Mentees', icon: Users, badge: students.length },
    { id: 'diagnostic', label: 'Diagnostic Exam', icon: Brain },
    { id: 'subjects', label: 'My Subjects', icon: BookMarked },
    { id: 'requests', label: 'Test Approvals', icon: Award, badge: pendingCount || null, badgeColor: 'bg-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <div className="bg-gray-900 border-b border-gray-800 py-6 px-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-0.5">Faculty Portal</p>
            <h1 className="text-2xl md:text-3xl font-black text-gray-100">
              Welcome, {user?.firstName} {user?.lastName} 👨‍🏫
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage mentees, edit diagnostic questions, review roadmaps &amp; approve tests.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/30 border border-purple-900 rounded-xl">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-300">Faculty Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-5">
        <div className="flex gap-1.5 bg-gray-100 border border-gray-800 p-1.5 rounded-xl w-fit flex-wrap">
          {tabs.map(({ id, label, icon: Icon, badge, badgeColor = 'bg-purple-500' }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer relative ${
                activeTab === id ? 'bg-gray-900 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.1)] border border-gray-800' : 'text-gray-400 hover:text-gray-100'
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              {badge > 0 && (
                <span className={`w-4 h-4 ${badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notice */}
      <Notice notice={notice} onClose={() => setNotice(null)} />

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20 space-y-4">

        {/* ── STUDENTS TAB ── */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" /> My Mentees ({students.length})
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Students who selected you as their faculty mentor</p>
              </div>
              <button onClick={loadStudents} className="p-2 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-950 text-gray-400 cursor-pointer transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" /> Loading mentee data…
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-300">No mentees yet.</p>
                <p className="text-xs mt-1">Students who select you as mentor will appear here.</p>
              </div>
            ) : (
              students.map((student) => {
                const sid = student.id || student.student_id;
                const isExpanded = expandedStudentId === sid;
                const firstName = student.first_name || student.firstName || '';
                const lastName = student.last_name || student.lastName || '';
                return (
                  <div key={sid} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-gray-300 transition">
                    {/* Student Row Header */}
                    <button type="button" onClick={() => toggleStudent(sid)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-950 transition cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-purple-900/30 border border-indigo-200 text-purple-300 text-sm font-black flex items-center justify-center shrink-0">
                          {firstName[0]}{lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-100 truncate">{firstName} {lastName}</div>
                          <div className="text-xs text-gray-400 truncate">{student.email}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{student.course_title || 'No course enrolled'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {student.current_level && <LevelBadge level={student.current_level} />}
                        {student.entrance_completed ? (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">Exam ✓</span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">No Exam</span>
                        )}
                        {student.roadmap_status === 'pending_approval' && (
                          <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg animate-pulse">Roadmap ⏳</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <StudentDetailPanel
                        student={student}
                        facultyName={`${user?.firstName} ${user?.lastName}`}
                        onNotice={showNotice}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── DIAGNOSTIC EXAM TAB ── */}
        {activeTab === 'diagnostic' && (
          <DiagnosticExamEditor onNotice={showNotice} />
        )}

        {/* ── SUBJECTS TAB ── */}
        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-purple-400" /> Publish New Subject
              </h3>
              <form onSubmit={handleUploadSubject} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Subject / Module Name *</label>
                  <input type="text" required value={subjectName} onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-300 text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                    placeholder="e.g. Advanced Machine Learning" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Description &amp; Syllabus</label>
                  <textarea rows={4} value={subjectDescription} onChange={(e) => setSubjectDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-300 text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                    placeholder="Describe what students will learn, key topics, prerequisites…" />
                </div>
                <button type="submit" disabled={uploadingSubject}
                  className="w-full py-3 font-bold text-white bg-purple-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  {uploadingSubject ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><Upload className="w-4 h-4" /> Publish Subject</>}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2 mb-4">
                <BookMarked className="w-5 h-5 text-purple-400" /> Published Subjects ({subjects.length})
              </h3>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-8 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 text-sm shadow-[0_0_15px_rgba(168,85,247,0.1)]">No subjects published yet.</div>
              ) : (
                <div className="space-y-3">
                  {subjects.map((sub) => (
                    <div key={sub.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-indigo-200 transition">
                      <div className="font-bold text-gray-100 text-sm mb-1">{sub.subject_name}</div>
                      {sub.description && <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{sub.description}</p>}
                      <div className="text-[11px] text-gray-400 mt-2 font-mono">Published: {new Date(sub.created_at || Date.now()).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" /> Weekly Periodic Test Approvals
              {pendingCount > 0 && <span className="ml-2 px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">{pendingCount} Pending</span>}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" /> Loading requests…
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <Award className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-300">No test access requests yet.</p>
              </div>
            ) : (
              requests.map((req) => {
                const name = req.student_first_name ? `${req.student_first_name} ${req.student_last_name}` : `${req.firstName || ''} ${req.lastName || ''}`;
                return (
                  <div key={req.request_id || req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <div>
                      <div className="font-bold text-gray-100 text-sm">{name.trim() || 'Unknown Student'}</div>
                      <div className="text-xs text-gray-400">{req.student_email}</div>
                      <div className="text-xs text-gray-400 mt-1.5">
                        Module: <span className="text-purple-400 font-semibold">{req.module_title || req.moduleTitle}</span>
                        {req.course_title && <span className="text-gray-400 ml-2">({req.course_title})</span>}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-1">
                        Requested: {new Date(req.requested_at || req.created_at).toLocaleString()}
                        {req.thresholdMet != null && (
                          <span className={`ml-3 font-semibold ${req.thresholdMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {req.thresholdMet ? '✓ Study threshold met' : '⚠ Below threshold'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {req.status === 'pending' ? (
                        <>
                          <button onClick={() => handleReviewRequest(req.request_id || req.id, 'approved')} disabled={reviewingId === (req.request_id || req.id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Test
                          </button>
                          <button onClick={() => handleReviewRequest(req.request_id || req.id, 'rejected')} disabled={reviewingId === (req.request_id || req.id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition disabled:opacity-50 cursor-pointer">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                          req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {req.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
