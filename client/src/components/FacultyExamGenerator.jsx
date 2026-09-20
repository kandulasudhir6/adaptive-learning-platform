import React, { useState } from 'react';
import { Database, Zap, Settings, CheckSquare } from 'lucide-react';

export default function FacultyExamGenerator() {
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [qCount, setQCount] = useState(15);
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-white">Exam Generator (C Programming)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" /> Assessment Configuration
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Target Difficulty</label>
                <div className="flex gap-3">
                  {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                    <button 
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition ${difficulty === level ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Topic Tags (Select to enforce)</label>
                <div className="flex flex-wrap gap-2">
                  {['C Syntax', 'Control Flow', 'Functions', 'Arrays & Strings', 'Pointers', 'Dynamic Memory (malloc/free)', 'Structs & Unions', 'File I/O', 'Macros'].map(tag => (
                    <label key={tag} className="flex items-center gap-2 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-lg cursor-pointer hover:border-gray-600 transition">
                      <input type="checkbox" className="rounded bg-gray-800 border-gray-700 text-indigo-500 focus:ring-indigo-500" defaultChecked={['Pointers', 'Dynamic Memory (malloc/free)'].includes(tag)} />
                      <span className="text-sm text-gray-300">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">MCQ Question Count: {qCount}</label>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  value={qCount} 
                  onChange={(e) => setQCount(e.target.value)}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-400" /> Auto-Generated Coding Test Cases
            </h3>
            
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300">
              <p className="text-gray-500 mb-2">// GCC Execution Sandbox Test Case Template (stdin/stdout)</p>
              <p><span className="text-pink-400">#include</span> <span className="text-green-300">&lt;stdio.h&gt;</span></p>
              <br/>
              <p><span className="text-blue-400">int</span> <span className="text-yellow-200">main</span>() {'{'}</p>
              <p className="pl-4">{"// Auto-injected test logic for C students"}</p>
              <p className="pl-4"><span className="text-blue-400">int</span> expected_cases = <span className="text-purple-400">5</span>;</p>
              <p className="pl-4">{"/* ... */"}</p>
              <p className="pl-4"><span className="text-pink-400">return</span> <span className="text-purple-400">0</span>;</p>
              <p>{'}'}</p>
            </div>
            
            <label className="flex items-center gap-3 mt-4 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-green-500 focus:ring-green-500" defaultChecked />
              <span className="text-sm text-gray-300">Require standard C compilation (gcc -O2)</span>
            </label>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg h-fit sticky top-24">
          <Database className="w-12 h-12 text-indigo-500/50 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Ready to Generate</h3>
          <p className="text-gray-400 text-sm mb-6">
            The AI engine will synthesize {qCount} unique C Programming questions tailored to {difficulty.toLowerCase()} level, incorporating dynamic test cases.
          </p>
          
          <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-[0_0_15px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2">
            <Zap className="w-5 h-5" /> Generate Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
