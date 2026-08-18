import React, { useState } from 'react';
import { 
  Brain, 
  Mic,
  GitCommit, 
  MessageSquare, 
  CheckSquare, 
  Sparkles, 
  Zap, 
  Clock, 
  TrendingUp, 
  Activity, 
  Plus, 
  ChevronRight,
  Flame,
  Check
} from 'lucide-react';
import { mockMemories } from '../../data/mockData';
import { GlassCard } from '../common/GlassCard';

export const DashboardScreen = ({
  user,
  onNavigate,
  onOpenCommandMenu,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [quickIndexSuccess, setQuickIndexSuccess] = useState(false);
  const [recentMemories, setRecentMemories] = useState(mockMemories);

  const handleQuickIndex = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const newMem = {
      id: `mem_new_${Date.now()}`,
      title: quickInput.length > 40 ? quickInput.slice(0, 40) + '...' : quickInput,
      summary: quickInput,
      category: 'insight',
      retentionScore: 100,
      tags: ['Quick Note', 'AI Index'],
      createdAt: 'Just now',
      contextSnippet: quickInput,
      relevanceScore: 100,
      isPinned: true,
      decayDays: 90,
      sourceSession: 'Dashboard Quick Bar'
    };

    setRecentMemories([newMem, ...recentMemories]);
    setQuickInput('');
    setQuickIndexSuccess(true);
    setTimeout(() => setQuickIndexSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-3xl bg-[#E8F3EC] border border-[#C9DFD2] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold bg-[#00684A] text-white">
              {user.plan}
            </span>
            <span className="text-xs text-[#00684A] font-mono font-bold">Cognitive Capacity: 88%</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001E2B] tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Your temporal brain has synchronized 1,420 memories and 3 active decision branches.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <button
            onClick={() => onNavigate('meeting')}
            className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4" />
            <span>Meeting Intelligence</span>
          </button>

          <button
            onClick={() => onNavigate('chat')}
            className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D1E2D7] text-[#001E2B] font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-[#00684A]" />
            <span>Ask RAG AI</span>
          </button>

          <button
            onClick={onOpenCommandMenu}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D1E2D7] text-[#001E2B] text-xs font-bold transition-all flex items-center gap-2 shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-[#00684A]" />
            <span>Cmd + K</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metric Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <GlassCard 
          glowColor="emerald" 
          onClick={() => onNavigate('brain')}
          className="p-5 border-[#D1E2D7] hover:border-[#00684A] cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              AI Brain Dashboard
            </span>
            <div className="p-2 rounded-xl bg-[#E8F3EC] text-[#00684A] group-hover:bg-[#00684A] group-hover:text-white transition-colors">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold font-mono text-[#001E2B] group-hover:text-[#00684A] transition-colors">
              Memory Profile
            </div>
            <span className="text-xs text-[#00684A] font-bold font-mono">Timeline →</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <div className="w-2 h-2 rounded-full bg-[#00ED64] animate-pulse" />
            <span>Active & Historical Memory Graph</span>
          </div>
        </GlassCard>

        <GlassCard glowColor="amber" className="p-5 border-[#D1E2D7]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Active Decisions
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <GitCommit className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold font-mono text-[#001E2B]">3 Branches</div>
            <span className="text-xs text-amber-700 font-bold font-mono">9.2 Max Impact</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>1 Evaluation Pending</span>
          </div>
        </GlassCard>

        <GlassCard glowColor="violet" className="p-5 border-[#D1E2D7]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Cognitive Capacity
            </span>
            <div className="p-2 rounded-xl bg-[#E8F3EC] text-[#00684A]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold font-mono text-[#001E2B]">88%</div>
            <span className="text-xs text-[#00684A] font-bold font-mono">High Focus</span>
          </div>
          <div className="mt-3 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#00684A] h-full w-[88%]" />
          </div>
        </GlassCard>

        <GlassCard glowColor="cyan" className="p-5 border-[#D1E2D7]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Time Saved Forecast
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold font-mono text-[#001E2B]">18.4 hrs</div>
            <span className="text-xs text-teal-700 font-bold font-mono">/ month</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <Zap className="w-3 h-3 text-teal-600" />
            <span>Instant Context Recall</span>
          </div>
        </GlassCard>

      </div>

      {/* Quick Idea & Memory Bar */}
      <GlassCard hoverEffect={false} className="p-5 border-[#D1E2D7] bg-white">
        <form onSubmit={handleQuickIndex} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 flex-1 w-full bg-[#F0F5F2] px-4 py-2.5 rounded-xl border border-[#D1E2D7] focus-within:border-[#00684A] transition-colors">
            <Brain className="w-4 h-4 text-[#00684A] shrink-0" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Index a fast memory node or decision note... (e.g. 'Decided to use Argon2id with 250k iterations')"
              className="w-full bg-transparent text-xs font-medium text-[#001E2B] placeholder-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
          >
            {quickIndexSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Indexed to Vault!</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Index Memory</span>
              </>
            )}
          </button>
        </form>
      </GlassCard>

      {/* Two Column Layout: Active Decision Radar & Memory Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Memory Stream (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#00684A]" />
              <h2 className="text-lg font-bold text-[#001E2B]">Recent Memory Stream</h2>
            </div>

            <button
              onClick={() => onNavigate('memory')}
              className="text-xs font-bold text-[#00684A] hover:underline flex items-center gap-1"
            >
              <span>View All 1,420 Vault Items</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentMemories.slice(0, 4).map((mem) => (
              <GlassCard
                key={mem.id}
                onClick={() => onNavigate('memory')}
                glowColor="emerald"
                className="p-4 bg-white border-[#D1E2D7]"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      mem.category === 'decision' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      mem.category === 'code' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                      'bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]'
                    }`}>
                      {mem.category}
                    </span>
                    <h3 className="text-sm font-bold text-[#001E2B] leading-tight">
                      {mem.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-mono font-extrabold text-[#00684A]">
                      {mem.retentionScore}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">Retention</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed font-medium">
                  {mem.summary}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#D1E2D7]">
                  <div className="flex items-center gap-2">
                    {mem.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#F0F5F2] text-slate-700 text-[10px] font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono text-slate-500 font-medium">{mem.createdAt}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Right Column: Decision Branch & Recommended Task */}
        <div className="space-y-6">
          
          {/* Active Decision Branch Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-[#001E2B]">Active Decision Tree</h2>
              </div>
              <button
                onClick={() => onNavigate('timeline')}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                <span>Timeline</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <GlassCard hoverEffect={false} className="p-5 border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  DECISION #101
                </span>
                <span className="text-xs text-amber-800 font-bold font-mono">Impact: 9.2 / 10</span>
              </div>

              <h3 className="text-sm font-bold text-[#001E2B] mb-2">
                Migrate Core State Engine to Server-Sent Events (SSE)
              </h3>

              <div className="space-y-2 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <div className="font-bold mb-0.5">✓ HTTP/2 SSE (Selected Choice)</div>
                  <div className="text-[11px] text-emerald-700 font-medium">Cut Cloud Run idle costs by 38%</div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('timeline')}
                className="w-full py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Simulate Alternate Scenario</span>
              </button>
            </GlassCard>
          </div>

          {/* AI Recommended Task */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#00684A]" />
                <h2 className="text-lg font-bold text-[#001E2B]">Recommended Task</h2>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-bold text-[#00684A] hover:underline"
              >
                View 4 Tasks
              </button>
            </div>

            <GlassCard hoverEffect={false} className="p-5 border-[#D1E2D7] bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]">
                  HIGH FOCUS • DEEP WORK
                </span>
                <span className="text-xs font-bold font-mono text-[#00684A]">Score: 94/100</span>
              </div>

              <h3 className="text-sm font-bold text-[#001E2B] mb-1">
                Finalize Zero-Knowledge Memory Envelope Specs
              </h3>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed font-medium">
                Document argon2id parameters and key derivation security boundary for SOC2 report.
              </p>

              <div className="p-2.5 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-[11px] font-bold text-[#00684A] flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Recommended Slot: 2:00 PM - 3:30 PM (Peak Window)</span>
              </div>

              <button
                onClick={() => onNavigate('tasks')}
                className="w-full py-2 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Start Focus Session</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </GlassCard>
          </div>

        </div>

      </div>

    </div>
  );
};
