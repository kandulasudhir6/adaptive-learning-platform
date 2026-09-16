import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import EntranceExamPage from './pages/EntranceExamPage';
import ModuleLearningPage from './pages/ModuleLearningPage';
import PeriodicExamPage from './pages/PeriodicExamPage';
import FacultyDashboard from './pages/FacultyDashboard';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-gray-500 text-sm font-medium">Loading EduVibe AI...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isStudent = user.role === 'student';
  const isFaculty = user.role === 'faculty' || user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
        {/* ─── STUDENT VIEWS ─── */}
        {isStudent && (
          <>
            {activeTab === 'dashboard' && (
              <StudentDashboard
                onOpenExam={() => setActiveTab('entrance-exam')}
                onOpenModule={(modId) => {
                  setSelectedModuleId(modId);
                  setActiveTab('module-view');
                }}
                onOpenPeriodicExam={(modId) => {
                  setSelectedModuleId(modId);
                  setActiveTab('periodic-exam');
                }}
              />
            )}

            {activeTab === 'entrance-exam' && (
              <EntranceExamPage
                onComplete={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'module-view' && (
              <ModuleLearningPage
                moduleId={selectedModuleId}
                onBack={() => setActiveTab('dashboard')}
                onRequestTest={() => setActiveTab('dashboard')}
                onOpenPeriodicExam={(modId) => {
                  setSelectedModuleId(modId);
                  setActiveTab('periodic-exam');
                }}
              />
            )}

            {activeTab === 'periodic-exam' && (
              <PeriodicExamPage
                moduleId={selectedModuleId}
                onComplete={() => setActiveTab('dashboard')}
                onBack={() => setActiveTab('dashboard')}
              />
            )}
          </>
        )}

        {/* ─── FACULTY VIEW ─── */}
        {isFaculty && (
          <FacultyDashboard />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
