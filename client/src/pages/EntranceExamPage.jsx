import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CodingArena from '../components/CodingArena';
import RoadmapViewer from '../components/RoadmapViewer';
import LevelBadge from '../components/LevelBadge';
import {
  Brain, Clock, ArrowRight, AlertCircle, HelpCircle,
  Code, ChevronRight, ChevronLeft, Trophy, RefreshCw, Zap
} from 'lucide-react';

const EXAM_DURATION_SECS = 20 * 60;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function EntranceExamPage({ onComplete }) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseId, setCourseId] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [examSessionId, setExamSessionId] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [codingChallenges, setCodingChallenges] = useState([]);
  
  const [part, setPart] = useState('mcq');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [answers, setAnswers] = useState({});
  const [codes, setCodes] = useState({});
  const [lastRunResults, setLastRunResults] = useState({});
  
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECS);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Connecting to AI Question Engine…');

  useEffect(() => {
    async function initExam() {
      try {
          setLoading(true);
          setLoadingStatus('Fetching enrolled course...');
  
          if (!user?.enrolledCourse) { 
            setError('No active course found. Please enroll in a course first before taking the diagnostic test.'); 
            setLoading(false);
            return; 
          }
          const course = { id: user.enrolledCourse.course_id, title: user.enrolledCourse.course_title };
          setCourseId(course.id);
          setCourseTitle(course.title);

        setLoadingStatus(`Generating AI diagnostic questions for "${course.title}"…`);

        const examRes = await api.exams.generateEntrance(course.id);

        if (examRes.success) {
          setExamSessionId(examRes.examSessionId);
          setQuestions(examRes.questions || []);

          const challenges = examRes.codingChallenges || [];
          if (examRes.codingChallenge && challenges.length === 0) {
            challenges.push(examRes.codingChallenge);
          }
          
          setCodingChallenges(challenges);
          const initialCodes = {};
          challenges.forEach(c => {
            initialCodes[c.id] = c.starterCode || '';
          });
          setCodes(initialCodes);
        } else {
          setError(examRes.error || 'Failed to initialize exam.');
        }
      } catch (err) {
        setError(err.message || 'Error generating exam. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    initExam();
  }, []);

  useEffect(() => {
    if (loading || result || !examSessionId) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [loading, result, timeLeft, examSessionId]);

  const handleSubmit = useCallback(async (isTimeout = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const responses = questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] || null,
        selectedOption: answers[q.id] || null, // fallback for backend
      }));
      
      const codingSubmissions = codingChallenges.map((c) => ({
        challengeId: c.id,
        code: codes[c.id] || '',
        testResults: lastRunResults[c.id]?.testCases || [],
      }));
      
      const res = await api.exams.submitEntrance(examSessionId, responses, codingSubmissions);
      if (res.success) {
        setResult(res);
        await refreshUser();
      } else {
        setError(res.error || 'Submission failed.');
      }
    } catch (err) {
      setError(err.message || 'Submission error.');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, examSessionId, questions, answers, codingChallenges, codes, lastRunResults, refreshUser]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 text-slate-300 px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Preparing Your Diagnostic Exam</h3>
            <p className="text-sm text-slate-400">{loadingStatus}</p>
            <p className="text-xs text-indigo-400 mt-2">✨ Questions are unique per session</p>
          </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="bg-slate-900 border border-rose-900/50 rounded-2xl p-6 max-w-md w-full text-center shadow-[0_0_15px_rgba(168,85,247,0.1)] space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-white font-bold text-lg">Exam Initialization Error</h3>
        <p className="text-sm text-rose-400">{error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setError(''); setLoading(true); window.location.reload(); }}
            className="px-4 py-2 bg-purple-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          {onComplete && (
            <button onClick={onComplete} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl transition">
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (result) return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-[0_0_15px_rgba(168,85,247,0.1)] mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-amber-500" />
          <span className="text-amber-500 font-bold text-sm uppercase tracking-wider">Diagnostic Complete</span>
        </div>
        <h2 className="text-4xl font-black text-white mb-2">
          {result.compositeScore ?? result.scorePercentage ?? '—'}%
        </h2>
        <p className="text-slate-400 text-sm mb-4">Overall Score</p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-300 mb-5 flex-wrap">
          {result.mcqPercentage !== undefined && (
            <div className="text-center">
              <div className="text-xl font-bold text-white">{result.mcqPercentage}%</div>
              <div className="text-xs text-slate-500">MCQ Score</div>
            </div>
          )}
          {result.codingScorePct !== undefined && (
            <div className="text-center">
              <div className="text-xl font-bold text-white">{result.codingScorePct}%</div>
              <div className="text-xs text-slate-500">Coding Score</div>
            </div>
          )}
          <div className="text-center">
            <div className="flex items-center justify-center">
              <LevelBadge level={result.assignedLevel || result.level || 'beginner'} />
            </div>
            <div className="text-xs text-slate-500 mt-1">Assigned Level</div>
          </div>
        </div>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Your AI personalized roadmap has been generated based on your performance.
        </p>
      </div>

      {result.roadmap && (
        <RoadmapViewer
          roadmap={result.roadmap}
          courseTitle={courseTitle}
          facultyName={result.assignedFacultyName || 'Faculty Mentor'}
        />
      )}

      <div className="mt-8 text-center">
        <button
          onClick={onComplete}
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.1)] transition flex items-center gap-2 mx-auto"
        >
          <ArrowRight className="w-4 h-4" /> Go to Dashboard
        </button>
      </div>
    </div>
  );

  if (!questions || questions.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="bg-slate-900 border border-amber-900/50 rounded-2xl p-6 max-w-md w-full text-center shadow-[0_0_15px_rgba(168,85,247,0.1)] space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-white font-bold">No Questions Loaded</h3>
        <p className="text-sm text-slate-400">
          The exam session was created but questions could not be loaded. This may happen if the entrance exam was already completed.
        </p>
        {onComplete && (
          <button onClick={onComplete} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition">
            Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Brain className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-white truncate">Diagnostic Exam — {courseTitle}</h2>
                <p className="text-xs text-slate-400">
                  {part === 'mcq' ? 'Part 1: AI-Generated MCQ Diagnostic' : 'Part 2: Coding Challenge'}
                </p>
              </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border ${
            timeLeft < 120
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-2 flex items-center gap-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setPart('mcq')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition shrink-0 ${
              part === 'mcq'
                ? 'bg-purple-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            MCQ ({Object.keys(answers).length}/{questions.length} answered)
          </button>
          
          {codingChallenges.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setPart(`coding-${i}`)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition shrink-0 ${
                part === `coding-${i}`
                  ? 'bg-purple-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Round {i + 1} ({c.difficulty})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {part === 'mcq' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">Question {currentIndex + 1} of {questions.length}</h3>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                currentQ.difficulty === 'advanced' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                currentQ.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {currentQ.difficulty} Level
              </span>
            </div>

            <div className="flex gap-1">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 flex-1 rounded-full transition ${
                    currentIndex === idx ? 'bg-purple-500' :
                    answers[q.id] ? 'bg-indigo-900' : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                  title={`Question ${idx + 1}`}
                />
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <p className="text-white font-medium text-lg mb-8 leading-relaxed">
                {currentQ.questionText || currentQ.question_text}
              </p>
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const options = currentQ.options || {};
                  const text = options[opt] || currentQ[`option_${opt.toLowerCase()}`];
                  const isSelected = answers[currentQ.id] === opt;
                  if (!text) return null;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswers((p) => ({ ...p, [currentQ.id]: opt }))}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-indigo-500 bg-purple-500/10'
                          : 'border-slate-700 hover:border-slate-600 bg-slate-800'
                      }`}
                    >
                      <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {opt}
                      </div>
                      <span className={`text-sm ${isSelected ? 'text-indigo-100 font-medium' : 'text-slate-300'}`}>
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={() => codingChallenges.length > 0 ? setPart('coding-0') : handleSubmit()}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white transition shadow-[0_0_15px_rgba(168,85,247,0.1)] flex items-center gap-2"
                >
                  {codingChallenges.length > 0 ? 'Continue to Coding' : 'Submit Exam'} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white transition shadow-[0_0_15px_rgba(168,85,247,0.1)] flex items-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {codingChallenges.map((c, i) => {
              if (part !== `coding-${i}`) return null;
              return (
                <CodingArena
                  key={c.id}
                  challenge={c}
                  code={codes[c.id]}
                  setCode={(val) => setCodes((p) => ({ ...p, [c.id]: val }))}
                  onCodeRunResult={(res) => setLastRunResults((p) => ({ ...p, [c.id]: res }))}
                />
              );
            })}
            
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => {
                  const idx = parseInt(part.split('-')[1], 10);
                  if (idx > 0) setPart(`coding-${idx - 1}`);
                  else setPart('mcq');
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition flex items-center gap-2"
              >
                Go Back
              </button>
              
              {parseInt(part.split('-')[1], 10) === codingChallenges.length - 1 ? (
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.1)] transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Full Exam'} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const idx = parseInt(part.split('-')[1], 10);
                    setPart(`coding-${idx + 1}`);
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.1)] transition flex items-center gap-2"
                >
                  Next Round <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


