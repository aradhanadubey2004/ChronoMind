import React from 'react';
import { 
  LayoutDashboard, 
  Brain, 
  Mic,
  GitCommit, 
  MessageSquare, 
  CheckSquare, 
  Settings,
  ChevronRight,
  Shield,
  Activity,
  Globe,
  Building2,
  BookOpen
} from 'lucide-react';

export const Sidebar = ({ activeScreen, onNavigate }) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: 'Overview',
      badgeColor: 'text-[#00684A] bg-[#E8F3EC] border-[#C9DFD2]',
    },
    {
      id: 'documents',
      label: 'Document Memory',
      icon: BookOpen,
      badge: 'RAG',
      badgeColor: 'text-cyan-800 bg-cyan-50 border-cyan-200',
    },
    {
      id: 'meeting',
      label: 'Meeting Intelligence',
      icon: Mic,
      badge: 'AI Recorder',
      badgeColor: 'text-[#00684A] bg-[#E8F3EC] border-[#C9DFD2]',
    },
    {
      id: 'brain',
      label: 'AI Brain Dashboard',
      icon: Brain,
      badge: 'Timeline',
      badgeColor: 'text-[#00684A] bg-[#E8F3EC] border-[#C9DFD2]',
    },
    {
      id: 'memory',
      label: 'Conversation Memory',
      icon: Brain,
      badge: '1.8k',
      badgeColor: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'timeline',
      label: 'Decision Timeline',
      icon: GitCommit,
      badge: '3 Active',
      badgeColor: 'text-amber-800 bg-amber-50 border-amber-200',
    },
    {
      id: 'chat',
      label: 'AI Memory Chat',
      icon: MessageSquare,
      badge: 'Assistant',
      badgeColor: 'text-teal-800 bg-teal-50 border-teal-200',
    },
    {
      id: 'tasks',
      label: 'Task Matrix',
      icon: CheckSquare,
      badge: '4 Tasks',
      badgeColor: 'text-slate-700 bg-slate-100 border-slate-200',
    },
    {
      id: 'settings',
      label: 'Profile & Settings',
      icon: Settings,
      badge: 'Config',
      badgeColor: 'text-[#00684A] bg-[#E8F3EC] border-[#C9DFD2]',
    }
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-[#D1E2D7] p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] shadow-xs">
      <div>
        {/* Workspace Selector */}
        <div className="p-3 rounded-2xl bg-[#F0F5F2] border border-[#D1E2D7] mb-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#00684A] flex items-center justify-center text-white font-bold text-xs shadow-xs shadow-emerald-700/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#001E2B]">Apex AI Ventures</p>
              <p className="text-[10px] text-slate-500 font-semibold">Pro Enterprise Workspace</p>
            </div>
          </div>
        </div>

        {/* Navigation Group */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Navigation
          </p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group
                  ${
                    isActive
                      ? 'bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2] shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-[#F0F5F2]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#00684A]' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Public Landing Link */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => onNavigate('landing')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Landing Page</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Bottom Cognitive Load Gauge Widget */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Memory Retention</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700">94%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full w-[94%]" />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <span>Zero Knowledge Mode</span>
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <Shield className="w-3 h-3 text-emerald-600" />
            Encrypted
          </span>
        </div>
      </div>
    </aside>
  );
};
