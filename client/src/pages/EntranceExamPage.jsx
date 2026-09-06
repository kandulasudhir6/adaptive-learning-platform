import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LevelBadge from '../components/LevelBadge';
import {
  Brain,
  Clock,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Award,
  Zap,
  RotateCcw,
} from 'lucide-react';

export default function EntranceExamPage({ onComplete }) {
  const { user, refreshUser } = useAuth();
  const [courseId, setCourseId] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [examSessionId, setExamSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes timer
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Initialize and load entrance exam
  useEffect(() => {
    async function initExam() {
      try {
        setLoading(true);
        // 1. Fetch courses
        const coursesRes = await api.courses.list();
        const course = coursesRes.courses?.[0];
        if (!course) {
          setError('No active courses found to take the entrance exam.');
          return;
        }
        setCourseId(course.id);
        setCourseTitle(course.title);

        // 2. Generate exam via MAPS
        const examRes = await api.exams.generateEntrance(course.id);
        if (examRes.success) {
          setExamSessionId(examRes.examSessionId);
          setQuestions(examRes.questions);
        } else {
          setError(examRes.error || 'Failed to initialize entrance exam.');
        }
      } catch (err) {
        setError(err.message || 'Error generating entrance exam.');
      } finally {
        setLoading(false);
      }
    }

    initExam();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!examSessionId || result || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [examSessionId, result, timeLeft]);

  const handleSelectOption = (questionId, optionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmitExam = async () => {
    if (!examSessionId) return;

    // Check unanswered
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formattedResponses = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] || null,
      }));

      const res = await api.exams.submitEntrance(examSessionId, formattedResponses);
      if (res.success) {
        setResult(res);
        await refreshUser();
      } else {
        setError(res.error || 'Failed to evaluate exam.');
      }
    } catch (err) {
      setError(err.message || 'Error submitting entrance exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-white">Generating Diagnostic Exam...</h2>
        <p className="text-sm text-slate-400 mt-2">
          Multi-Tiered Adaptive Pool Sampling (MAPS) is curating 15 balanced questions...
        </p>
      </div>
    );
  }

  // Result View
  if (result) {
    const levelColors = {
      beginner: 'from-emerald-600 to-teal-700 border-emerald-500/30',
      intermediate: 'from-blue-600 to-indigo-700 border-blue-500/30',
      advanced: 'from-purple-600 to-violet-700 border-purple-500/30',
    };

    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Header Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Diagnostic Evaluation Complete
            </h2>
            <p className="text-slate-400 mt-1">
              Your knowledge has been evaluated across foundational, intermediate, and advanced domains.
            </p>
          </div>

          {/* Level Placement Card */}
          <div
            className={`p-6 rounded-2xl bg-gradient-to-br ${
              levelColors[result.assignedLevel] || levelColors.beginner
            } text-white shadow-xl mb-8 border`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-bold">
                  Assigned Starting Level
                </div>
                <div className="text-3xl font-extrabold mt-1 capitalize tracking-tight flex items-center gap-2">
                  <Zap className="w-6 h-6 text-amber-300" />
                  {result.assignedLevel} Level
                </div>
                <p className="text-sm text-white/90 mt-2 max-w-md">
                  {result.assignedLevel === 'beginner' &&
                    'Placed in Level 1. You will build core competencies with linear data structures and Big-O foundations.'}
                  {result.assignedLevel === 'intermediate' &&
                    'Placed in Level 2. Level 1 foundational modules have been bypassed. You start directly with Linked Lists, BSTs, and Stacks!'}
                  {result.assignedLevel === 'advanced' &&
                    'Placed in Level 3. Excellent mastery! Levels 1 & 2 are bypassed. You start directly with Dynamic Programming and Advanced Graphs.'}
                </p>
              </div>

              <div className="bg-black/20 backdrop-blur-md px-6 py-4 rounded-xl text-center border border-white/10 min-w-[140px]">
                <div className="text-3xl font-black">{result.scorePercentage}%</div>
                <div className="text-xs text-white/80 font-medium">Weighted Score</div>
                <div className="text-[11px] text-white/70 mt-1">
                  {result.totalEarnedPoints} / {result.maxPossiblePoints} pts
                </div>
              </div>
            </div>
          </div>

          {/* Tier Performance Breakdown */}
          <div className="mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              MAPS Multi-Tier Accuracy Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {['beginner', 'intermediate', 'advanced'].map((tier) => {
                const b = result.breakdown?.[tier] || { correct: 0, total: 5, points: 0 };
                const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
                return (
                  <div key={tier} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-semibold uppercase text-slate-400 capitalize">
                      {tier}
                    </div>
                    <div className="text-xl font-bold text-white mt-1">
                      {b.correct} / {b.total}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{pct}% Accuracy</div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onComplete}
            className="w-full py-4 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 text-base transition"
          >
            Access My Calibrated Curriculum
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Active Exam View
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Exam Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              MAPS Diagnostic Engine
            </span>
            <span className="text-xs text-slate-400">15 Questions</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">{courseTitle}</h2>
        </div>

        {/* Timer & Progress */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <Clock className={`w-4 h-4 ${timeLeft < 180 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span className={`font-mono text-sm font-bold ${timeLeft < 180 ? 'text-rose-400' : 'text-slate-200'}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div className="font-semibold text-slate-200">
              {answeredCount} of {questions.length} Answered
            </div>
            <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
          {/* Question Metadata */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize border ${
                  currentQ.difficulty === 'beginner'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : currentQ.difficulty === 'intermediate'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                }`}
              >
                {currentQ.difficulty} Tier ({currentQ.difficulty === 'beginner' ? '1.0 pt' : currentQ.difficulty === 'intermediate' ? '2.0 pts' : '3.0 pts'})
              </span>
            </div>
          </div>

          {/* Question Statement */}
          <h3 className="text-base sm:text-lg font-medium text-white mb-6 leading-relaxed">
            {currentQ.questionText}
          </h3>

          {/* Options Grid */}
          <div className="space-y-3 mb-8">
            {['A', 'B', 'C', 'D'].map((key) => {
              const optionText = currentQ.options[key];
              const isSelected = answers[currentQ.id] === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="text-sm pt-1">{optionText}</span>
                </button>
              );
            })}
          </div>

          {/* Question Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              Previous
            </button>

            {/* Question Quick Jump Dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-6 h-6 rounded-md text-[11px] font-bold transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                        : isAnswered
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-slate-950 text-slate-600 border border-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitExam}
                className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {submitting ? 'Scoring Exam...' : 'Submit Diagnostic'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
