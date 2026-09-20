import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import RoadmapViewer from '../components/RoadmapViewer';
import LevelBadge from '../components/LevelBadge';
import {
  Users, BookOpen, Upload, CheckCircle2, AlertCircle, Clock,
  Map, Loader2, Save, ChevronDown, ChevronUp, BarChart3, Edit3, User, ClipboardCheck, Settings, Shield
} from 'lucide-react';

function Notice({ notice, onClose }) {
  if (!notice) return null;
  return (
    <div className="px-6 mt-4">
      <div className={`flex items-center gap-2.5 p-4 rounded-xl border text-sm ${
        notice.type === 'success' ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' : 'bg-red-900/30 border-red-500/50 text-red-200'
      }`}>
        {notice.type === 'success'
          ? <CheckCircle2 className="w-5 h-5 shrink-0 text-purple-400" />
          : <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
        }
        <span>{notice.message}</span>
        <button className="ml-auto text-xs opacity-60 hover:opacity-100 cursor-pointer" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

function StudentDetailPanel({ student, onNotice }) {
  const studentId = student.id || student.student_id;
  const [roadmap, setRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [editingRoadmap, setEditingRoadmap] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.faculty.getStudentRoadmap(studentId)
      .then(res => setRoadmap(res.roadmap))
      .catch(err => onNotice({ type: 'error', message: err.message }))
      .finally(() => setLoadingRoadmap(false));
  }, [studentId]);

  const handleSaveRoadmap = async () => {
    if (!roadmap) return;
    setSaving(true);
    try {
      await api.faculty.updateStudentRoadmap(roadmap.id, { 
        milestones: roadmap.milestones,
        facultyNotes: roadmap.faculty_notes,
        status: 'approved'
      });
      onNotice({ type: 'success', message: 'Roadmap approved and saved successfully.' });
      setEditingRoadmap(false);
    } catch (err) {
      onNotice({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 border-t border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white flex items-center gap-2">
          <Map className="w-5 h-5 text-purple-400" /> Personalized Roadmap
        </h4>
        <button
          onClick={() => editingRoadmap ? handleSaveRoadmap() : setEditingRoadmap(true)}
          disabled={saving || loadingRoadmap}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            editingRoadmap 
              ? 'bg-purple-600 text-white hover:bg-purple-500' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingRoadmap ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />)}
          {editingRoadmap ? 'Save Changes' : 'Edit Roadmap'}
        </button>
      </div>

      {loadingRoadmap ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : roadmap ? (
        <RoadmapViewer 
          roadmap={roadmap} 
          courseTitle={roadmap.course_title}
          facultyName={roadmap.faculty_first_name}
        />
      ) : (
        <div className="text-gray-500 text-center py-8">No roadmap data available.</div>
      )}
    </div>
  );
}

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ subject_name: '', category: 'programming', description: '' });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  const showNotice = (n) => { setNotice(n); setTimeout(() => setNotice(null), 4000); };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'requests') {
          const res = await api.faculty.getRequests();
          setRequests(res.requests || []);
        } else if (activeTab === 'students') {
          const res = await api.faculty.getMyStudents();
          setStudents(res.students || []);
        } else if (activeTab === 'settings') {
          const res = await api.faculty.getFacultySubjects();
          setSubjects(res.subjects || []);
        }
      } catch (err) {
        showNotice({ type: 'error', message: 'Failed to load data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            PRIVID
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Faculty Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'students' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <Users className="w-5 h-5" /> My Students
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'requests' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" /> Test Requests
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <Settings className="w-5 h-5" /> Settings
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center text-purple-400 font-bold border border-purple-500">
              {user?.firstName?.[0] || 'F'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-200">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">Faculty</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Notice notice={notice} onClose={() => setNotice(null)} />
        
        <div className="p-8 max-w-6xl w-full mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
              <p className="text-gray-400">Loading data...</p>
            </div>
          ) : activeTab === 'requests' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black text-white">Pending Test Requests</h1>
                <span className="text-gray-400">{requests.length} Requests</span>
              </div>
              {requests.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
                  <ClipboardCheck className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400">No pending test requests to review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.request_id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div>
                        <h3 className="text-lg font-bold text-gray-100">{req.student_first_name} {req.student_last_name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{req.course_title} - {req.module_title}</p>
                        <div className="flex items-center gap-3 text-xs font-medium">
                          <span className={`px-2 py-1 rounded-md ${req.thresholdMet ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                            {req.thresholdLabel}
                          </span>
                          <span className="text-gray-500">Time spent: {req.formattedTimeSpent}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                          onClick={async () => {
                            try {
                              const res = await api.faculty.reviewRequest(req.request_id, { status: 'approved' });
                              if(res.success) {
                                showNotice({ type: 'success', message: 'Test approved!' });
                                setRequests(prev => prev.filter(r => r.request_id !== req.request_id));
                              }
                            } catch (e) { showNotice({ type: 'error', message: 'Failed to approve.'}); }
                          }}
                          className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition cursor-pointer"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              const res = await api.faculty.reviewRequest(req.request_id, { status: 'rejected', rejectionReason: 'Study time requirement not met.' });
                              if(res.success) {
                                showNotice({ type: 'success', message: 'Test rejected.' });
                                setRequests(prev => prev.filter(r => r.request_id !== req.request_id));
                              }
                            } catch (e) { showNotice({ type: 'error', message: 'Failed to reject.'}); }
                          }}
                          className="flex-1 md:flex-none px-4 py-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 text-gray-300 font-bold rounded-lg transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'students' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black text-white">My Students</h1>
                <span className="text-gray-400">{students.length} Total</span>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
                  <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400">No students are currently assigned to you.</p>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                  <div className="divide-y divide-gray-800">
                    {students.map(student => {
                      const id = student.id || student.student_id;
                      const isExpanded = expandedStudentId === id;
                      return (
                        <div key={id} className="transition-colors hover:bg-gray-800/30">
                          <div 
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedStudentId(isExpanded ? null : id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-900/30 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 font-bold">
                                {student.first_name[0]}
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-200">{student.first_name} {student.last_name}</h3>
                                <p className="text-sm text-gray-500">{student.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <LevelBadge level={student.current_level} />
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <StudentDetailPanel student={student} onNotice={showNotice} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'settings' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-black text-white">Faculty Settings</h1>
              
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-indigo-400" /> Secure Classroom Login
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Enable dynamic QR code authentication for secure terminal login in the classroom. When enabled, you must scan the QR code using your registered authenticator device to verify your presence.
                </p>
                <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-[0_0_15px_rgba(79,70,229,0.2)] cursor-pointer">
                  Configure Secure Login
                </button>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-indigo-400" /> My Specialized Subjects
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Add subjects you specialize in so that students can choose you as their mentor for these topics.
                </p>
                <div className="flex gap-3 mb-6">
                  <input type="text" placeholder="Subject Name (e.g. Data Structures)" className="flex-1 bg-gray-950 border border-gray-800 text-gray-100 text-sm rounded-lg px-4 py-2" value={newSubject.subject_name} onChange={e => setNewSubject({...newSubject, subject_name: e.target.value})} />
                  <input type="text" placeholder="Category" className="w-1/4 bg-gray-950 border border-gray-800 text-gray-100 text-sm rounded-lg px-4 py-2" value={newSubject.category} onChange={e => setNewSubject({...newSubject, category: e.target.value})} />
                  <button onClick={async () => {
                    if(!newSubject.subject_name) return;
                    try {
                      await api.faculty.uploadFacultySubject(newSubject);
                      setNewSubject({ subject_name: '', category: 'programming', description: '' });
                      const res = await api.faculty.getFacultySubjects();
                      setSubjects(res.subjects || []);
                      showNotice({ type: 'success', message: 'Subject added!' });
                    } catch(e) { showNotice({ type: 'error', message: 'Failed to add subject' }); }
                  }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm cursor-pointer">Add Subject</button>
                </div>
                {subjects.length > 0 && (
                  <div className="space-y-2">
                    {subjects.map(sub => (
                      <div key={sub.id} className="px-4 py-3 bg-gray-800/50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-200">{sub.subject_name}</p>
                          <p className="text-xs text-gray-500 uppercase">{sub.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}







