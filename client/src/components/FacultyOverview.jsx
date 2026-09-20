import React from 'react';
import { Users, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

export default function FacultyOverview() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-white">Overview / Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Total Enrolled Students</p>
            <p className="text-3xl font-black text-white">142</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center text-green-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Avg. Diagnostic Score</p>
            <p className="text-3xl font-black text-white">68%</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-semibold">Completion Rate</p>
            <p className="text-3xl font-black text-white">82%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6">Student Progress Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Beginner (Module 1)</span>
                <span className="text-gray-200 font-bold">45%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-indigo-500 h-3 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Intermediate (Module 2)</span>
                <span className="text-gray-200 font-bold">35%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-purple-500 h-3 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Advanced (Module 3)</span>
                <span className="text-gray-200 font-bold">20%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-pink-500 h-3 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activities & Alerts</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start p-3 bg-gray-800/40 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-gray-200 font-medium">Maria S. completed C Fundamentals Diagnostic</p>
                <p className="text-gray-500 text-sm">2 hours ago • Scored 90%</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-gray-200 font-medium">Alex M. is struggling with Pointers & Memory</p>
                <p className="text-gray-500 text-sm">4 hours ago • Failed coding round 3 times</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-3 bg-gray-800/40 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-gray-200 font-medium">Jason T. passed Structs & File Operations</p>
                <p className="text-gray-500 text-sm">Yesterday • Scored 85%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
