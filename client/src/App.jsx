import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import EntranceExamPage from './pages/EntranceExamPage';
import ModuleLearningPage from './pages/ModuleLearningPage';
import PeriodicExamPage from './pages/PeriodicExamPage';
import FacultyDashboard from './pages/FacultyDashboard';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [authView, setAuthView] = useState('landing'); // 'landing' | 'login' | 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-800 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm font-medium">Loading PRIVID...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'login') {
      return <LoginPage onBack={() => setAuthView('landing')} onRegisterClick={() => setAuthView('register')} />;
    }
    if (authView === 'register') {
      return <RegisterPage onBack={() => setAuthView('landing')} onLoginClick={() => setAuthView('login')} />;
    }
    return <LandingPage onRegisterClick={() => setAuthView('register')} onLoginClick={() => setAuthView('login')} />;
  }

  const isStudent = user.role === 'student';
  const isFaculty = user.role === 'faculty' || user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
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
