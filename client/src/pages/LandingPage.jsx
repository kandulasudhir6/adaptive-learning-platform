import React from 'react';
import { ArrowRight, Sparkles, BrainCircuit, ShieldCheck } from 'lucide-react';

export default function LandingPage({ onRegisterClick }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center text-gray-100 font-sans">
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 text-center max-w-4xl mx-auto py-12">
        
        {/* Glowing Logo representation */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-purple-600 blur-[40px] opacity-30 rounded-full"></div>
          <h1 className="relative text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
            PRIVID
          </h1>
          <p className="mt-2 text-purple-400 tracking-[0.2em] uppercase text-sm font-bold opacity-80">
            Advanced Adaptive Learning
          </p>
        </div>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl leading-relaxed">
          Unlock your potential with an AI-driven curriculum that adapts to your skill level in real-time. Start your journey with C Programming and master the fundamentals of computer science.
        </p>

        <button 
          onClick={onRegisterClick}
          className="group relative px-8 py-4 bg-purple-600 rounded-lg font-bold text-lg text-white hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.8)] overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="relative flex items-center gap-2">
            Register / Login <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center text-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <BrainCircuit className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-100 mb-2">Smart Assessment</h3>
            <p className="text-gray-400 text-sm">Dynamic diagnostic exams generate unique questions to test your true baseline.</p>
          </div>
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center text-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <Sparkles className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-100 mb-2">Adaptive Roadmaps</h3>
            <p className="text-gray-400 text-sm">Your learning path automatically adjusts based on your performance and goals.</p>
          </div>
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center text-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <ShieldCheck className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-100 mb-2">Faculty Mentorship</h3>
            <p className="text-gray-400 text-sm">Get assigned to an expert mentor who monitors your progress and guides your journey.</p>
          </div>
        </div>
      </div>

      <footer className="w-full text-center py-6 border-t border-gray-800 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} PRIVID. All rights reserved.
      </footer>
    </div>
  );
}
