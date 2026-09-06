import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LevelBadge from '../components/LevelBadge';
import Modal from '../components/Modal';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Database,
  Check,
  X,
  AlertTriangle,
  BookOpen,
  Calendar,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export default function MentorDashboard({ initialTab = 'requests' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [requests, setRequests] = useState([]);
  const [roster, setRoster] = useState([]);
  const [questionBank, setQuestionBank] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Question filter state
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        const res = await api.mentor.getRequests();
        if (res.success) setRequests(res.requests);
      } else if (activeTab === 'roster') {
        const res = await api.mentor.getRoster();
        if (res.success) setRoster(res.students);
      } else if (activeTab === 'questions') {
        const res = await api.mentor.getQuestionBank();
        if (res.success) setQuestionBank(res);
      }
    } catch (err) {
      console.error('Error loading mentor data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      const res = await api.mentor.reviewRequest(requestId, { status: 'approved' });
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Request APPROVED! Student now has access to start the periodic test.',
        });
        setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to approve request.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (requestId) => {
    setSelectedRequestId(requestId);
    setRejectionFeedback('Please review the key module algorithms and spend more time studying before requesting.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequestId || !rejectionFeedback) return;
    setProcessingId(selectedRequestId);
    try {
      const res = await api.mentor.reviewRequest(selectedRequestId, {
        status: 'rejected',
        rejectionReason: rejectionFeedback,
      });
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Request rejected with mentor feedback sent to student.',
        });
        setRequests((prev) => prev.filter((r) => r.request_id !== selectedRequestId));
        setRejectModalOpen(false);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      alert(err.message || 'Error rejecting request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Banner Notice */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="w-5 h-5" />
            {statusMessage.text}
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {user?.role?.toUpperCase()} Control Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Verify student time commitments, review periodic test requests, and monitor curriculum progression.
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'roster'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Student Roster
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'questions'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Question Bank
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: PENDING TEST REQUESTS (Matching Wireframe B) */}
      {activeTab === 'requests' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Periodic Test Requests
            </h2>
            <span className="text-xs text-slate-400">
              Showing {requests.length} pending request(s)
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">All Caught Up!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                There are no pending periodic test requests requiring review right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.request_id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Student & Module Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base text-white">
                          Student: {req.student_first_name} {req.student_last_name}
                        </span>
                        <span className="text-xs text-slate-400">({req.student_email})</span>
                        <LevelBadge level={req.student_current_level} size="sm" />
                      </div>

                      <div className="text-sm text-slate-300 font-medium">
                        Course:{' '}
                        <span className="text-indigo-400 font-semibold">{req.course_title}</span> |{' '}
                        Module: <span className="text-slate-100">{req.module_title}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          Requested: {new Date(req.requested_at).toLocaleDateString()} at{' '}
                          {new Date(req.requested_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {/* Threshold Metric Tag */}
                        <span className="flex items-center gap-1.5">
                          Time Spent on Content:{' '}
                          <strong className="text-slate-200">{req.formattedTimeSpent}</strong>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              req.thresholdMet
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            ({req.thresholdLabel})
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Approve / Reject Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(req.request_id)}
                        disabled={processingId === req.request_id}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Approve Access
                      </button>

                      <button
                        onClick={() => handleOpenRejectModal(req.request_id)}
                        disabled={processingId === req.request_id}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Reject with Feedback
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENT ROSTER */}
      {activeTab === 'roster' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
          <h2 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Enrolled Student Roster &amp; Progression Metrics
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Assigned Level</th>
                  <th className="px-4 py-3.5">Entrance Diagnostic</th>
                  <th className="px-4 py-3.5">Modules Completed</th>
                  <th className="px-4 py-3.5">Avg Periodic Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {roster.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-4 font-semibold text-white">
                      <div>
                        {s.first_name} {s.last_name}
                      </div>
                      <div className="text-slate-500 text-[11px] font-normal">{s.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <LevelBadge level={s.current_level} size="sm" />
                    </td>
                    <td className="px-4 py-4">
                      {s.entrance_completed ? (
                        <span className="font-bold text-slate-200">
                          {s.entrance_score ? `${s.entrance_score}%` : 'Completed'}
                        </span>
                      ) : (
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px] font-bold uppercase">
                          Pending Exam
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-200">
                      {s.completed_modules_count} modules
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-200">
                      {s.avg_periodic_score ? `${s.avg_periodic_score}%` : 'No tests taken'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION BANK */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Difficulty Filter Chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Filter Tier:
            </span>
            {['all', 'beginner', 'intermediate', 'advanced'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedDifficulty(tier)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize border transition ${
                  selectedDifficulty === tier
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Question List */}
          <div className="grid grid-cols-1 gap-4">
            {questionBank?.sampleQuestions
              ?.filter((q) => selectedDifficulty === 'all' || q.difficulty === selectedDifficulty)
              ?.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <LevelBadge level={q.difficulty} size="sm" />
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Key: {q.correct_option}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{q.question_text}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Reject Feedback Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Periodic Test Request with Feedback"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Explain to the student why access has been deferred (e.g. insufficient study time, specific concepts to review).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Mentor Guidance / Reason
            </label>
            <textarea
              rows={4}
              value={rejectionFeedback}
              onChange={(e) => setRejectionFeedback(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Please spend at least 1 more hour reviewing AVL rotations..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={processingId !== null || !rejectionFeedback}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
