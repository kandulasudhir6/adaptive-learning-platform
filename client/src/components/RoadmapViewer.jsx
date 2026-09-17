import React from 'react';
import { Sparkles, CheckCircle2, Clock, BookOpen, Target, FileCheck2, AlertCircle, Calendar, Layers, Award, UserCheck } from 'lucide-react';
import LevelBadge from './LevelBadge';

export default function RoadmapViewer({ roadmap, courseTitle, facultyName }) {
  if (!roadmap) return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
      <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
      <h4 className="text-gray-200 font-semibold text-base mb-1">No Roadmap Generated Yet</h4>
      <p className="text-sm">Complete the entrance exam to generate your AI personalized roadmap.</p>
    </div>
  );

  const roadmapData = typeof roadmap.roadmap_json === 'string' ? JSON.parse(roadmap.roadmap_json) : roadmap.roadmap_json || roadmap;
  const status = roadmap.status || 'pending_approval';
  const assignedFaculty = facultyName || roadmap.faculty_name || 'Assigned Faculty Mentor';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-900/30 text-purple-300 border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5" /> AI Personalized Roadmap
              </span>
              <LevelBadge level={roadmapData.evaluated_level || roadmap.evaluated_level || 'intermediate'} />
            </div>
            <h2 className="text-2xl font-black text-gray-100">{courseTitle || roadmapData.course_name || 'Mastery Learning Path'}</h2>
          </div>
          <div>
            {status === 'approved' ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div><div className="text-xs font-bold uppercase">Faculty Approved</div><div className="text-[11px] text-green-600">By {assignedFaculty}</div></div>
              </div>
            ) : status === 'rejected' ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div><div className="text-xs font-bold uppercase">Revision Requested</div><div className="text-[11px]">Pending adjustments</div></div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <div><div className="text-xs font-bold uppercase">Pending Approval</div><div className="text-[11px]">Awaiting {assignedFaculty}</div></div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Calendar, label: 'Duration', value: `${roadmapData.total_estimated_weeks || 8} Weeks`, color: 'text-indigo-500' },
            { icon: Clock, label: 'Commitment', value: `${roadmapData.weekly_hours || 10} hrs/wk`, color: 'text-blue-500' },
            { icon: Layers, label: 'Milestones', value: `${roadmapData.milestones?.length || 0} Phases`, color: 'text-indigo-500' },
            { icon: UserCheck, label: 'Mentor', value: assignedFaculty, color: 'text-green-500', truncate: true },
          ].map(({ icon: Icon, label, value, color, truncate }) => (
            <div key={label} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
              <div className={`text-xs text-gray-400 flex items-center gap-1.5 mb-1 font-medium`}><Icon className={`w-3.5 h-3.5 ${color}`} />{label}</div>
              <div className={`text-sm font-bold text-gray-100 ${truncate ? 'truncate' : ''}`} title={truncate ? value : undefined}>{value}</div>
            </div>
          ))}
        </div>

        {roadmap.faculty_notes && (
          <div className="mt-5 p-4 rounded-xl bg-purple-900/30 border border-purple-900 text-indigo-800 text-sm">
            <div className="flex items-center gap-2 font-semibold text-purple-300 mb-1"><Award className="w-4 h-4" />Mentor Notes ({assignedFaculty})</div>
            <p className="text-gray-300 text-xs leading-relaxed">{roadmap.faculty_notes}</p>
          </div>
        )}
      </div>

      {/* Competencies */}
      {roadmapData.target_competencies && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />Core Competencies
          </h4>
          <div className="flex flex-wrap gap-2">
            {roadmapData.target_competencies.map((comp, idx) => (
              <span key={idx} className="px-3 py-1 rounded-xl bg-gray-100 text-gray-300 text-xs font-medium border border-gray-800">{comp}</span>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />Curriculum Phases
        </h3>
        <div className="relative border-l-2 border-gray-800 ml-4 pl-6 space-y-5">
          {roadmapData.milestones?.map((ms, idx) => (
            <div key={ms.phase || idx} className="relative group">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-indigo-400 group-hover:bg-indigo-400 transition" />
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-indigo-200">Phase {ms.phase || idx + 1}</span>
                    <h4 className="text-base font-bold text-gray-100">{ms.title}</h4>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Weeks {ms.weeks} ({ms.estimated_hours} hrs)</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">{ms.description}</p>
                {ms.topics && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-400 mb-2">Key Topics:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {ms.topics.map((t, tidx) => (
                        <span key={tidx} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 border border-gray-800">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {ms.deliverable && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border border-green-100 text-xs">
                    <FileCheck2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div><span className="font-semibold text-green-700">Deliverable: </span><span className="text-gray-400">{ms.deliverable}</span></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
