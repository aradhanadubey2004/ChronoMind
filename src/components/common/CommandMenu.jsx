import React, { useState, useEffect } from 'react';
import { Search, Brain, Mic, GitCommit, MessageSquare, CheckSquare, Zap, X, Shield, Sparkles, Settings } from 'lucide-react';

export const CommandMenu = ({
  isOpen,
  onClose,
  onNavigate,
  onQuickAction,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectScreen = (screen) => {
    onNavigate(screen);
    onClose();
  };

  const handleTriggerAction = (label) => {
    if (onQuickAction) onQuickAction(label);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#D1E2D7] gap-3">
          <Search className="w-5 h-5 text-[#00684A]" />
          <input
            type="text"
            placeholder="Search conversation memories, decisions, settings... (e.g. 'PostgreSQL vs DynamoDB')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-[#001E2B] placeholder-slate-400 focus:outline-none text-sm font-semibold"
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono font-extrabold text-[#00684A] bg-[#E8F3EC] rounded border border-[#C9DFD2]">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-[#E8F3EC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command Options */}
        <div className="p-3 max-h-[380px] overflow-y-auto space-y-4">
          {/* Quick Navigation Section */}
          <div>
            <div className="px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Navigation & Views
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleSelectScreen('dashboard')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#E8F3EC] text-slate-800 hover:text-[#00684A] transition-colors text-sm text-left group font-semibold"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#E8F3EC] text-[#00684A] group-hover:scale-105 transition-transform">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span>Dashboard Overview</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-[#00684A] font-extrabold">Main Metrics</span>
              </button>

              <button
                onClick={() => handleSelectScreen('documents')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-cyan-50 text-slate-800 hover:text-cyan-800 transition-colors text-sm text-left group font-semibold"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800 group-hover:scale-105 transition-transform">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span>Document Memory RAG</span>
                </div>
                <span className="text-xs text-cyan-700 font-extrabold">PDF / TXT / Word</span>
              </button>

              <button
                onClick={() => handleSelectScreen('meeting')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#E8F3EC] text-slate-800 hover:text-[#00684A] transition-colors text-sm text-left group font-semibold"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#E8F3EC] text-[#00684A] group-hover:scale-105 transition-transform">
                    <Mic className="w-4 h-4" />
                  </div>
                  <span>Meeting Intelligence</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-[#00684A] font-extrabold">Audio & Transcripts</span>
              </button>

              <button
                onClick={() => handleSelectScreen('brain')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#E8F3EC] text-slate-800 hover:text-[#00684A] transition-colors text-sm text-left group font-semibold"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#E8F3EC] text-[#00684A] group-hover:scale-105 transition-transform">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span>AI Brain Dashboard</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-[#00684A] font-extrabold">Active & Timeline</span>
              </button>

              <button
                onClick={() => handleSelectScreen('memory')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50/80 text-slate-700 hover:text-emerald-700 transition-colors text-sm text-left group font-medium"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span>Conversation Memory Page</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-emerald-600 font-semibold">1,842 Memories</span>
              </button>

              <button
                onClick={() => handleSelectScreen('timeline')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-50/80 text-slate-700 hover:text-amber-700 transition-colors text-sm text-left group font-medium"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 group-hover:scale-105 transition-transform">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <span>Decision Timeline</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-amber-600 font-semibold">3 Active Decisions</span>
              </button>

              <button
                onClick={() => handleSelectScreen('chat')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50/80 text-slate-700 hover:text-indigo-700 transition-colors text-sm text-left group font-medium"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>AI Memory Chat Assistant</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-semibold">Interactive AI</span>
              </button>

              <button
                onClick={() => handleSelectScreen('tasks')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 transition-colors text-sm text-left group font-medium"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:scale-105 transition-transform">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <span>Task Management Matrix</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-blue-600 font-semibold">4 Tasks</span>
              </button>

              <button
                onClick={() => handleSelectScreen('settings')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-50/80 text-slate-700 hover:text-purple-700 transition-colors text-sm text-left group font-medium"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600 group-hover:scale-105 transition-transform">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span>Profile and Settings</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-purple-600 font-semibold">Account Config</span>
              </button>
            </div>
          </div>

          {/* Quick AI Trigger Actions */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              AI Productivity Shortcuts
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTriggerAction('Simulate Alternative Scenario')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition-all"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Simulate Decision
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">Project long-term risk & outcome</p>
              </button>

              <button
                onClick={() => handleTriggerAction('Index Memory Node')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition-all"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  Index New Memory
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">Store key meeting notes</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">Zero-Knowledge Encryption Verified</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span>Press <strong>↵</strong> to jump</span>
          </div>
        </div>
      </div>
    </div>
  );
};
