import React, { useState } from 'react';
import { 
  Brain, 
  Mic,
  Search, 
  Sparkles, 
  ShieldCheck, 
  Bell, 
  User as UserIcon,
  Menu,
  X,
  GitCommit,
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Zap,
  ArrowRight
} from 'lucide-react';

export const Navbar = ({
  activeScreen,
  onNavigate,
  onOpenCommandMenu,
  user,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicView = activeScreen === 'landing' || activeScreen === 'auth';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D1E2D7] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Core Identifier */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00684A] text-white flex items-center justify-center font-bold shadow-md shadow-emerald-700/20 group-hover:bg-[#00523A] transition-all">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#001E2B]">ChronoMind</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2] font-bold">AI v2.4</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5">Cognitive Memory Engine</p>
            </div>
          </button>

          {/* Quick Status Tag on Desktop */}
          {!isPublicView && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F3EC] border border-[#C9DFD2] text-xs font-semibold text-[#00684A]">
              <span className="w-2 h-2 rounded-full bg-[#00ED64] animate-pulse" />
              <span>1,842 Memories Synced</span>
            </div>
          )}
        </div>

        {/* Center Search Palette Trigger (Only shown inside app) */}
        {!isPublicView && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              onClick={onOpenCommandMenu}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-white text-slate-400 text-xs transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-[#00684A] group-hover:text-[#00523A]" />
                <span className="font-semibold text-slate-600">Search memory vault, decisions, tasks...</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-[#00684A] bg-[#E8F3EC] px-2 py-0.5 rounded-md border border-[#C9DFD2] font-extrabold">
                <span>⌘K</span>
              </div>
            </button>
          </div>
        )}

        {/* Right Action Navigation / User Menu */}
        <div className="flex items-center gap-3">
          
          {isPublicView ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('auth')}
                className="px-4 py-2 text-xs font-bold text-[#00684A] hover:text-[#00523A] hover:bg-[#E8F3EC] rounded-xl transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-[#00684A] hover:bg-[#00523A] rounded-xl shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <span>Launch App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Command Menu Button for Mobile */}
              <button
                onClick={onOpenCommandMenu}
                className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                title="Open Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Memory Sync Status */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-mono text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">Zero-Knowledge</span>
              </div>

              {/* Notification Bell */}
              <button className="relative p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>

              {/* User Avatar & Profile Link */}
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-xl bg-[#E8F3EC] hover:bg-[#D8ECE0] border border-[#C9DFD2] transition-colors group text-left"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/30"
                />
                <div className="hidden sm:block">
                  <p className="text-xs font-extrabold text-[#001E2B] group-hover:text-[#00684A] leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-[#00684A] font-semibold leading-tight">
                    {user.plan}
                  </p>
                </div>
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>
          )}

        </div>

      </div>

      {/* Mobile Drawer Menu (When triggered on smaller screens) */}
      {mobileMenuOpen && !isPublicView && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2 shadow-lg animate-fade-in">
          <button
            onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${activeScreen === 'dashboard' ? 'bg-[#E8F3EC] text-[#00684A]' : 'text-slate-700'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => { onNavigate('meeting'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${activeScreen === 'meeting' ? 'bg-[#E8F3EC] text-[#00684A]' : 'text-slate-700'}`}
          >
            <Mic className="w-4 h-4 text-[#00684A]" />
            <span>Meeting Intelligence</span>
          </button>

          <button
            onClick={() => { onNavigate('brain'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${activeScreen === 'brain' ? 'bg-[#E8F3EC] text-[#00684A]' : 'text-slate-700'}`}
          >
            <Brain className="w-4 h-4 text-[#00684A]" />
            <span>AI Brain Dashboard</span>
          </button>

          <button
            onClick={() => { onNavigate('memory'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${activeScreen === 'memory' ? 'bg-[#E8F3EC] text-[#00684A]' : 'text-slate-700'}`}
          >
            <Brain className="w-4 h-4" />
            <span>Conversation Memory</span>
          </button>

          <button
            onClick={() => { onNavigate('timeline'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${activeScreen === 'timeline' ? 'bg-[#E8F3EC] text-[#00684A]' : 'text-slate-700'}`}
          >
            <GitCommit className="w-4 h-4" />
            <span>Decision Timeline</span>
          </button>

          <button
            onClick={() => { onNavigate('chat'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${activeScreen === 'chat' ? 'bg-[#E8F3EC] text-[#00684A]' : 'text-slate-700'}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Memory Chat</span>
          </button>

          <button
            onClick={() => { onNavigate('tasks'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${activeScreen === 'tasks' ? 'bg-[#E8F3EC] text-[#00684A]' : 'text-slate-700'}`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Task Matrix</span>
          </button>

          <button
            onClick={() => { onNavigate('settings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${activeScreen === 'settings' ? 'bg-[#E8F3EC] text-[#00684A]' : 'text-slate-700'}`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile & Settings</span>
          </button>
        </div>
      )}
    </header>
  );
};
