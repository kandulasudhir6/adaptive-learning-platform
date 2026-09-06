import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import EntranceExamPage from './pages/EntranceExamPage';
import ModuleLearningPage from './pages/ModuleLearningPage';
import PeriodicExamPage from './pages/PeriodicExamPage';
import MentorDashboard from './pages/MentorDashboard';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isStudent = user.role === 'student';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
        {isStudent ? (
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
                onComplete={() => {
                  setActiveTab('dashboard');
                }}
              />
            )}

            {activeTab === 'module-view' && (
              <ModuleLearningPage
                moduleId={selectedModuleId}
                onBack={() => setActiveTab('dashboard')}
                onRequestTest={() => {
                  setActiveTab('dashboard');
                }}
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
        ) : (
          /* Mentor / Faculty / Admin Dashboard */
          <MentorDashboard initialTab={activeTab === 'dashboard' ? 'requests' : activeTab} />
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
