import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import LevelBadge from '../components/LevelBadge';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Play,
  Send,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Hourglass,
  PlusCircle,
  Code,
  Layers,
  AlertTriangle,
  Lightbulb,
  Cpu,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

export default function ModuleLearningPage({ moduleId, onBack, onRequestTest, onOpenPeriodicExam }) {
  const [module, setModule] = useState(null);
  const [progress, setProgress] = useState(null);
  const [testRequest, setTestRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('all');
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    async function loadModule() {
      try {
        setLoading(true);
        const res = await api.courses.getModule(moduleId);
        if (res.success) {
          setModule(res.module);
          setProgress(res.progress);
          setTestRequest(res.testRequest);
          setSecondsSpent((res.progress?.time_spent_minutes || 0) * 60);
        }
      } catch (err) {
        console.error('Error loading module:', err);
      } finally {
        setLoading(false);
      }
    }
    loadModule();
  }, [moduleId]);

  // Live timer tracking study duration
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogProgress = async (additionalMins = 15, markComplete = true) => {
    setSyncing(true);
    try {
      const res = await api.courses.updateProgress(moduleId, {
        additionalMinutes: additionalMins,
        markCompleted: markComplete,
      });
      if (res.success) {
        setProgress({
          time_spent_minutes: res.timeSpentMinutes,
          is_completed: res.isCompleted ? 1 : 0,
        });
        setSecondsSpent(res.timeSpentMinutes * 60);
        setMessage(`Logged ${additionalMins}m of focused study! Total time: ${res.timeSpentMinutes} mins.`);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-gray-500">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-medium text-gray-700">Curating detailed course study matter...</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-red-500 font-semibold">Module not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-gray-800 text-sm font-semibold shadow-sm transition cursor-pointer">
          Back to Curriculum
        </button>
      </div>
    );
  }

  const hours = Math.floor(secondsSpent / 3600);
  const mins = Math.floor((secondsSpent % 3600) / 60);
  const secs = secondsSpent % 60;
  const timerStr = `${hours > 0 ? `${hours}h ` : ''}${mins}m ${secs}s`;

  // Parse markdown blocks into structured sections
  const rawSections = module.content_body.split('\n---\n');
  const contentSections = rawSections.slice(1);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-gray-900">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Curriculum
        </button>

        {/* Live Study Session Timer & Quick Loggers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3.5 py-1.5 rounded-xl text-xs shadow-sm">
            <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="text-gray-500">Study Time:</span>
            <strong className="text-gray-900 font-mono">{timerStr}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleLogProgress(15, true)}
              disabled={syncing}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition cursor-pointer"
            >
              +15m
            </button>
            <button
              onClick={() => handleLogProgress(30, true)}
              disabled={syncing}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm transition cursor-pointer"
            >
              +30m
            </button>
            <button
              onClick={() => handleLogProgress(60, true)}
              disabled={syncing}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {syncing ? 'Saving...' : 'Log 1 Hour (+60m)'}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {message}
        </div>
      )}

      {/* Module Banner Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                {module.course_code} • Sequence #{module.sequence_order}
              </span>
              <LevelBadge level={module.level} size="sm" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {module.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Recommended Time: <strong className="text-gray-800 font-semibold">{Math.floor(module.study_time_recommended / 60)} hours</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Depth: <strong className="text-gray-800 font-semibold">Exhaustive Theoretical &amp; Practical Guide</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Status:{' '}
                <strong className={progress?.is_completed ? 'text-emerald-700 font-semibold' : 'text-gray-700'}>
                  {progress?.is_completed ? 'Content Mastered & Completed' : 'In Progress'}
                </strong>
              </span>
            </div>
          </div>

          {/* Jump to Test CTA */}
          <div className="flex-shrink-0">
            {testRequest?.status === 'approved' ? (
              <button
                onClick={() => onOpenPeriodicExam(module.id)}
                className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Start Approved Periodic Test
              </button>
            ) : testRequest?.status === 'pending' ? (
              <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center gap-2">
                <Hourglass className="w-4 h-4 animate-spin text-amber-600" />
                Under Faculty Review
              </div>
            ) : (
              <button
                onClick={() => onRequestTest(module.id)}
                className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Request Test Access
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Study Matter Body */}
      <div className="space-y-6">
        {contentSections.length > 0 ? (
          contentSections.map((sec, secIdx) => {
            const lines = sec.trim().split('\n');
            const heading = lines[0]?.replace(/^#+\s*/, '') || `Section ${secIdx + 1}`;
            const bodyLines = lines.slice(1).join('\n');

            return (
              <div
                key={secIdx}
                className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm"
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                    {secIdx + 1}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">{heading}</h2>
                </div>

                {/* Section Markdown Rendering */}
                <div className="max-w-none text-gray-700 space-y-4 leading-relaxed">
                  {bodyLines.split('\n\n').map((paragraph, pIdx) => {
                    const trimmed = paragraph.trim();

                    // Subheadings
                    if (trimmed.startsWith('### ')) {
                      return (
                        <h4
                          key={pIdx}
                          className="text-base font-bold text-gray-900 tracking-wide mt-6 mb-2 flex items-center gap-2"
                        >
                          <ChevronRight className="w-4 h-4 text-indigo-600" />
                          {trimmed.replace('### ', '')}
                        </h4>
                      );
                    }
                    if (trimmed.startsWith('## ')) {
                      return (
                        <h3 key={pIdx} className="text-lg font-bold text-gray-900 tracking-tight mt-6 mb-3">
                          {trimmed.replace('## ', '')}
                        </h3>
                      );
                    }

                    // Code Blocks
                    if (trimmed.startsWith('```')) {
                      const codeContent = trimmed.replace(/```[a-z]*/g, '').trim();
                      const isAsciiDiagram = codeContent.includes('+--') || codeContent.includes('▲') || codeContent.includes('State 1:');

                      return (
                        <div key={pIdx} className="my-4 rounded-xl overflow-hidden border border-gray-800 shadow-sm bg-gray-900">
                          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between text-xs text-gray-300">
                            <span className="font-mono flex items-center gap-1.5">
                              <Code className="w-3.5 h-3.5 text-indigo-400" />
                              {isAsciiDiagram ? 'Architecture / Memory Layout' : 'Implementation Script'}
                            </span>
                            <button
                              onClick={() => copyToClipboard(codeContent, `${secIdx}-${pIdx}`)}
                              className="hover:text-white transition flex items-center gap-1 cursor-pointer"
                            >
                              {copiedIndex === `${secIdx}-${pIdx}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-400 leading-relaxed">
                            <code>{codeContent}</code>
                          </pre>
                        </div>
                      );
                    }

                    // Unordered Bullet Points
                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                      const items = trimmed.split('\n');
                      return (
                        <ul key={pIdx} className="space-y-2 my-3 pl-2">
                          {items.map((item, iIdx) => (
                            <li key={iIdx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0"></span>
                              <span>{item.replace(/^[-*]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    // Standard Paragraph
                    return (
                      <p key={pIdx} className="text-sm sm:text-base text-gray-700 leading-relaxed">
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          /* Fallback for single section content */
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-gray-700 leading-relaxed">
              {module.content_body}
            </pre>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Ready for Periodic Evaluation?
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
            Once you have reviewed the theoretical proofs, memory layouts, and algorithmic implementations,
            request access from your faculty mentor to sit for the periodic test.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 bg-white border border-gray-300 transition cursor-pointer shadow-sm"
          >
            Back to Curriculum
          </button>

          {testRequest?.status === 'approved' ? (
            <button
              onClick={() => onOpenPeriodicExam(module.id)}
              className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4" />
              Start Periodic Test
            </button>
          ) : testRequest?.status === 'pending' ? (
            <div className="px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center gap-2">
              <Hourglass className="w-4 h-4 animate-spin text-amber-600" />
              Request Pending Review
            </div>
          ) : (
            <button
              onClick={() => onRequestTest(module.id)}
              className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Request Test Access From Faculty
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
