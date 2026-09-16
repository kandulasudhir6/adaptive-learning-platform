import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, Terminal, AlertCircle, Code, Cpu } from 'lucide-react';
import { api } from '../utils/api';

export default function CodingArena({ challenge, code, setCode, onCodeRunResult }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [runError, setRunError] = useState(null);
  const [activeTab, setActiveTab] = useState('testcases');

  if (!challenge) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 shadow-sm">
      <Cpu className="w-12 h-12 mx-auto mb-3 text-indigo-400 animate-pulse" />
      <p className="font-medium">Loading coding challenge...</p>
    </div>
  );

  const handleReset = () => {
    if (window.confirm('Reset code back to starting template?')) {
      setCode(challenge.starterCode || '');
      setResults(null);
      setRunError(null);
    }
  };

  const handleRunTestCases = async () => {
    setRunning(true);
    setRunError(null);
    try {
      const res = await api.code.run({ code, challengeId: challenge.id });
      if (res.success) { setResults(res); if (onCodeRunResult) onCodeRunResult(res); }
      else setRunError(res.error || 'Execution failed');
    } catch (err) { setRunError(err.message || 'Execution error'); }
    finally { setRunning(false); }
  };

  const publicCases = challenge.testCases ? challenge.testCases.filter((tc) => !tc.hidden) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-lg">{challenge.title}</h3>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                challenge.difficulty === 'hard' ? 'bg-red-50 text-red-600 border-red-200' :
                challenge.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                'bg-green-50 text-green-600 border-green-200'
              }`}>{challenge.difficulty || 'Intermediate'}</span>
            </div>
            <p className="text-xs text-gray-500">Function: <code className="text-indigo-600 font-mono">{challenge.functionName}</code></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleReset}
            className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" />Reset
          </button>
          <button type="button" onClick={handleRunTestCases} disabled={running}
            className="px-4 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer">
            {running ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Executing...</> :
              <><Play className="w-3.5 h-3.5 fill-current" />Run Test Cases</>}
          </button>
        </div>
      </div>

      {/* Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Left: Problem */}
        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white overflow-y-auto max-h-[560px]">
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Problem Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{challenge.description}</p>
            </div>
            {publicCases.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Sample Test Cases</h4>
                <div className="space-y-2.5">
                  {publicCases.map((tc, idx) => (
                    <div key={tc.id || idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono">
                      <div className="text-gray-600 mb-1"><span className="text-gray-400">Input:</span> <span className="text-gray-900">{typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input)}</span></div>
                      <div className="text-green-700"><span className="text-gray-400">Expected:</span> <span>{typeof tc.expectedOutput === 'object' ? JSON.stringify(tc.expectedOutput) : String(tc.expectedOutput)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-700">
              <div className="flex items-center gap-2 font-semibold mb-1"><Terminal className="w-4 h-4" />CodeTantra Sandbox Engine</div>
              <p className="text-indigo-500 leading-relaxed">Runs in an isolated VM with 2s timeout. Public cases verify basics; hidden edge cases run on submission.</p>
            </div>
          </div>
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-7 flex flex-col bg-gray-900">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>JavaScript (ES2024 Node.js)</span>
            <span>Lines: {(code || '').split('\n').length}</span>
          </div>
          <div className="relative flex-1 min-h-[280px]">
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck="false"
              className="w-full h-full min-h-[280px] p-4 font-mono text-sm bg-gray-900 text-green-400 placeholder-gray-600 focus:outline-none resize-y" />
          </div>

          {/* Output Panel */}
          <div className="border-t border-gray-700 bg-gray-800">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 text-xs font-medium">
              <div className="flex gap-4">
                {['testcases', 'console'].map((tab) => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                    className={`pb-1 border-b-2 transition capitalize cursor-pointer ${activeTab === tab ? 'border-indigo-400 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                    {tab === 'testcases' ? `Test Results${results ? ` (${results.summary?.passed}/${results.summary?.total})` : ''}` : 'Console'}
                  </button>
                ))}
              </div>
              {results && (
                <span className={`flex items-center gap-1 text-xs font-semibold ${results.summary?.allPassed ? 'text-green-400' : 'text-red-400'}`}>
                  {results.summary?.allPassed ? <><CheckCircle2 className="w-3.5 h-3.5" />All Passed</> : <><XCircle className="w-3.5 h-3.5" />{results.summary?.failed} Failed</>}
                </span>
              )}
            </div>
            <div className="p-4 max-h-[220px] overflow-y-auto">
              {runError && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="font-mono whitespace-pre-wrap">{runError}</div>
                </div>
              )}
              {!runError && !results && (
                <div className="text-center py-6 text-gray-500 text-xs font-mono">Click "Run Test Cases" to evaluate your code.</div>
              )}
              {!runError && results && activeTab === 'testcases' && (
                <div className="space-y-2">
                  {results.testCases?.map((tc, idx) => (
                    <div key={tc.id || idx} className={`p-2.5 rounded-xl border text-xs font-mono ${tc.passed ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {tc.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                          Test #{idx + 1}
                        </div>
                        <span className="text-[10px] text-gray-400">{tc.executionTimeMs || 0}ms</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-gray-400">Expected: </span><span className="text-gray-200">{JSON.stringify(tc.expectedOutput)}</span></div>
                        <div><span className="text-gray-400">Actual: </span><span className={tc.passed ? 'text-green-300' : 'text-red-300'}>{JSON.stringify(tc.actualOutput)}</span></div>
                      </div>
                      {tc.error && <div className="text-red-400 text-[10px] mt-1 bg-red-900/40 p-1.5 rounded">{tc.error}</div>}
                    </div>
                  ))}
                </div>
              )}
              {!runError && results && activeTab === 'console' && (
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 font-mono text-xs text-gray-300 min-h-[80px]">
                  {results.logs?.length > 0 ? results.logs.map((log, i) => <div key={i} className="text-gray-400"><span className="text-gray-600 mr-2">&gt;</span>{log}</div>) :
                    <span className="text-gray-600 italic">No console logs emitted.</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
