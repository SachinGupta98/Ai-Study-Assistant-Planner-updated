
import React from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface HeaderProps {
    username?: string;
    onLogout?: () => void;
    onInstallClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, onLogout, onInstallClick }) => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-slate-700">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpenIcon className="w-8 h-8 text-cyan-400" />
          <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">AI Study Assistant</h1>
              <p className="text-xs text-slate-400">For School, College, Competitive Exams & Skills</p>
          </div>
        </div>
        {username && (
            <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm text-slate-300 hidden sm:block">Welcome, {username}</span>
                {onInstallClick && (
                    <button
                        onClick={onInstallClick}
                        className="p-2 text-slate-400 hover:text-cyan-400 transition rounded-full hover:bg-slate-800"
                        aria-label="Install App"
                        title="Install App"
                    >
                        <DownloadIcon className="w-6 h-6" />
                    </button>
                )}
                <button 
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-cyan-400 transition rounded-full hover:bg-slate-800"
                    aria-label="Logout"
                >
                    <LogoutIcon className="w-6 h-6" />
                </button>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;