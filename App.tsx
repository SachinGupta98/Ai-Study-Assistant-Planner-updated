
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StudyPlanner from './components/StudyPlanner';
import TutorChat from './components/TutorChat';
import GeneralChat from './components/GeneralChat';
import History from './components/History';
import Auth from './components/Auth';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { ChatBubbleIcon } from './components/icons/ChatBubbleIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';
import { GeneralChatIcon } from './components/icons/GeneralChatIcon';
import { getCurrentUser, logout } from './services/authService';

// Define BeforeInstallPromptEvent interface as it's not in standard TS lib
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type ActiveView = 'planner' | 'tutor' | 'companion' | 'history';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('planner');
  const [currentUser, setCurrentUser] = useState<string | null>(getCurrentUser());
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setActiveView('planner'); // Reset to default view on logout
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setInstallPrompt(null); // The prompt can only be used once
  };

  const navButtonClasses = (view: ActiveView) => 
    `flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:p-4 text-xs sm:text-base font-semibold border-b-2 transition duration-200 ${
        activeView === view 
        ? 'text-cyan-400 border-cyan-400 bg-slate-800/50' 
        : 'text-slate-400 border-transparent hover:bg-slate-800'
    }`;

  if (!currentUser) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-slate-100">
            <div className="w-full max-w-md mx-auto">
                <Header />
                <Auth onAuthSuccess={handleLogin} />
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      <Header 
        username={currentUser} 
        onLogout={handleLogout} 
        onInstallClick={installPrompt ? handleInstallClick : undefined}
      />
      <nav className="flex bg-slate-900 border-b border-slate-700">
        <button onClick={() => setActiveView('planner')} className={navButtonClasses('planner')}>
            <BookOpenIcon className="w-5 h-5"/>
            Planner
        </button>
        <button onClick={() => setActiveView('tutor')} className={navButtonClasses('tutor')}>
            <ChatBubbleIcon className="w-5 h-5" />
            AI Tutor
        </button>
        <button onClick={() => setActiveView('companion')} className={navButtonClasses('companion')}>
            <GeneralChatIcon className="w-5 h-5" />
            Companion
        </button>
        <button onClick={() => setActiveView('history')} className={navButtonClasses('history')}>
            <HistoryIcon className="w-5 h-5" />
            History
        </button>
      </nav>
      <main className="flex-1 overflow-y-auto">
        {activeView === 'planner' && <StudyPlanner />}
        {activeView === 'tutor' && <TutorChat />}
        {activeView === 'companion' && <GeneralChat />}
        {activeView === 'history' && <History />}
      </main>
    </div>
  );
};

export default App;