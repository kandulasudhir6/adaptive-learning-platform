import React, { useState } from 'react';
import { BookOpen, Code, Edit3, Eye, EyeOff, FileText, Download } from 'lucide-react';

export default function FacultyCourseManagement() {
  const [modules, setModules] = useState([
    { id: 1, title: 'Module 1: C Setup & Variables', status: 'published' },
    { id: 2, title: 'Module 2: Control Flow & Loops', status: 'published' },
    { id: 3, title: 'Module 3: Functions & Memory', status: 'published' },
    { id: 4, title: 'Module 4: Pointers & Arrays', status: 'published' },
    { id: 5, title: 'Module 5: Structs & File Handling', status: 'draft' }
  ]);

  const toggleStatus = (id) => {
    setModules(modules.map(m => m.id === id ? { ...m, status: m.status === 'published' ? 'draft' : 'published' } : m));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Course Management</h1>
          <p className="text-gray-400 mt-1">Managing: <span className="text-indigo-400 font-semibold">C Programming Language: Zero to Hero</span></p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-[0_0_15px_rgba(79,70,229,0.2)]">
          + Add New Module
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="divide-y divide-gray-800">
          {modules.map((mod) => (
            <div key={mod.id} className="p-6 transition-colors hover:bg-gray-800/30">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mt-1 ${mod.status === 'published' ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/30' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-200">{mod.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Structured curriculum content and coding exercises.</p>
                    
                    <div className="flex gap-4 mt-4">
                      <button className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition">
                        <Edit3 className="w-3.5 h-3.5" /> Edit Content
                      </button>
                      <button className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition">
                        <Code className="w-3.5 h-3.5" /> Configure Code Runner
                      </button>
                      <button className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition">
                        <Download className="w-3.5 h-3.5" /> Code Assets (.zip)
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${mod.status === 'published' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-yellow-900/40 text-yellow-500 border border-yellow-800'}`}>
                    {mod.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                  </span>
                  
                  <button 
                    onClick={() => toggleStatus(mod.id)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mt-2"
                  >
                    {mod.status === 'published' ? (
                      <><EyeOff className="w-4 h-4" /> Unpublish</>
                    ) : (
                      <><Eye className="w-4 h-4" /> Publish</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
