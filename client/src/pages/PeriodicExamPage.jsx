import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  Clock,
  CheckCircle,
  XCircle,
  Award,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export default function PeriodicExamPage({ moduleId, onComplete, onBack }) {
  const [examSessionId, setExamSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 mins
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initPeriodic() {
      try {
        setLoading(true);
        const res = await api.exams.startPeriodic(moduleId);
        if (res.success) {
          setExamSessionId(res.examSessionId);
          setQuestions(res.questions);
        } else {
          setError(res.error || 'Failed to start periodic exam.');
        }
      } catch (err) {
        setError(err.message || 'Error starting periodic exam. (Requires mentor approval)');
      } finally {
        setLoading(false);
      }
    }
    initPeriodic();
  }, [moduleId]);

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

  const handleSubmit = async () => {
    if (!examSessionId) return;
    setSubmitting(true);
    setError('');

    try {
      const formattedResponses = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] || null,
      }));

      const res = await api.exams.submitPeriodic(examSessionId, formattedResponses);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || 'Failed to score exam.');
      }
    } catch (err) {
      setError(err.message || 'Error submitting exam.');
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
      <div className="max-w-3xl mx-auto py-16 text-center text-gray-400">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-medium text-gray-300">Loading approved periodic test...</p>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="p-6 sm:p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-100 mb-2">Test Authorization Notice</h3>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-gray-900 border border-gray-300 hover:bg-gray-950 text-gray-200 rounded-xl text-sm font-semibold shadow-[0_0_15px_rgba(168,85,247,0.1)] transition cursor-pointer"
          >
            Back to Curriculum
          </button>
        </div>
      </div>
    );
  }

  // Result View
  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in text-gray-100">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-[0_0_15px_rgba(168,85,247,0.1)] text-center">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
              result.isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {result.isPassed ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <h2 className="text-2xl font-black text-gray-100">
            {result.isPassed ? 'Periodic Test Passed!' : 'Threshold Not Met'}
          </h2>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">{result.message}</p>

          {/* Score card */}
          <div className="my-8 p-6 bg-gray-950 rounded-2xl border border-gray-800 max-w-xs mx-auto">
            <div className="text-4xl font-black text-gray-100">{result.scorePercentage}%</div>
            <div className="text-xs text-gray-400 mt-1 font-medium">
              {result.correctCount} of {result.totalCount} Questions Correct
            </div>
            <div
              className={`mt-2 text-xs font-bold uppercase tracking-wider ${
                result.isPassed ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {result.isPassed ? 'Status: Mastery Verified' : 'Status: Review Recommended'}
            </div>
          </div>

          <button
            onClick={onComplete}
            className="px-6 py-3.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(168,85,247,0.1)] text-sm transition inline-flex items-center gap-2 cursor-pointer"
          >
            Return to Curriculum
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in text-gray-100">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 flex items-center justify-between shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Authorized Periodic Evaluation
          </span>
          <h2 className="text-lg font-bold text-gray-100 mt-2">Module Knowledge Assessment</h2>
        </div>

        <div className="flex items-center gap-2 bg-gray-950 px-3.5 py-1.5 rounded-xl border border-gray-800">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="font-mono text-sm font-bold text-gray-100">{formatTimer(timeLeft)}</span>
        </div>
      </div>

      {currentQ && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Question {currentIndex + 1} of {questions.length}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-gray-100 mb-6 leading-relaxed">
            {currentQ.questionText}
          </h3>

          <div className="space-y-3 mb-8">
            {['A', 'B', 'C', 'D'].map((key) => {
              const optionText = currentQ.options[key];
              const isSelected = answers[currentQ.id] === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-900/30 border-indigo-500 text-indigo-950 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-300 hover:bg-gray-950'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="text-sm pt-0.5 font-medium">{optionText}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-100 disabled:opacity-30 transition cursor-pointer"
            >
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-200 bg-gray-900 border border-gray-300 hover:bg-gray-950 shadow-[0_0_15px_rgba(168,85,247,0.1)] transition cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_15px_rgba(168,85,247,0.1)] transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Scoring...' : 'Submit Periodic Test'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
