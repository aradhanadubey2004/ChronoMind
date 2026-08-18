import React, { useState } from 'react';
import { 
  Brain, 
  GitCommit, 
  MessageSquare, 
  CheckSquare, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Search, 
  ChevronRight
} from 'lucide-react';
import { mockPricingPlans } from '../../data/mockData';
import { GlassCard } from '../common/GlassCard';
import { Footer } from '../layout/Footer';

export const LandingPage = ({ onNavigate }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [activeDemoTab, setActiveDemoTab] = useState('timeline');
  const [demoQuery, setDemoQuery] = useState('PostgreSQL vs DynamoDB');

  return (
    <div className="min-h-screen bg-[#F2F6F4] text-[#001E2B] selection:bg-emerald-500/20 selection:text-emerald-950 font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden bg-grid-pattern bg-ambient-emerald">
        {/* Glow ambient circle */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#00ED64]/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F3EC] border border-[#C9DFD2] text-[#00684A] text-xs font-bold tracking-wide mb-8 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#00684A]" />
            <span>Introducing ChronoMind AI v2.4</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ED64]" />
            <span className="text-slate-600 font-mono">Retrieval-Augmented Cognitive Architecture</span>
          </div>

          {/* Main Display Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#001E2B] max-w-4xl mx-auto leading-[1.1] mb-6">
            Your Brain Has No Undo Button.{' '}
            <span className="text-gradient-emerald">ChronoMind AI Does.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            The next-generation cognitive engine for founders & senior engineers. Seamlessly index long-term conversation memories, simulate decision trees, and structure AI focus tasks.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#00684A] hover:bg-[#023430] text-white font-extrabold text-base shadow-lg shadow-emerald-800/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span>Explore Interactive Prototype</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('memory')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-[#E8F3EC] border border-[#C9DFD2] text-[#001E2B] font-bold text-base transition-all hover:border-[#00684A] shadow-xs flex items-center justify-center gap-2"
            >
              <Brain className="w-5 h-5 text-[#00684A]" />
              <span>Inspect Memory Vault</span>
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <GlassCard hoverEffect={false} className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#00684A]">100%</div>
              <div className="text-xs text-slate-600 font-semibold mt-1">Zero-Knowledge Encrypted</div>
            </GlassCard>

            <GlassCard hoverEffect={false} className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700">42%</div>
              <div className="text-xs text-slate-600 font-semibold mt-1">TTFT Speculative Latency Cut</div>
            </GlassCard>

            <GlassCard hoverEffect={false} className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-700">3.8 hrs</div>
              <div className="text-xs text-slate-600 font-semibold mt-1">Saved Per Engineer / Week</div>
            </GlassCard>

            <GlassCard hoverEffect={false} className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-800">&lt; 15ms</div>
              <div className="text-xs text-slate-600 font-semibold mt-1">Memory Vector Graph Recall</div>
            </GlassCard>
          </div>

        </div>
      </section>

      {/* Interactive Live Demo Preview Section */}
      <section className="py-16 bg-white/80 border-y border-[#D1E2D7] relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001E2B] mb-3">
              Experience the Temporal Engine Live
            </h2>
            <p className="text-slate-600 text-sm max-w-lg mx-auto font-medium">
              Test how ChronoMind links memories across conversations, predicts decision risks, and schedules deep focus tasks.
            </p>
          </div>

          {/* Demo Shell Box */}
          <div className="bg-[#F0F5F2] border border-[#D1E2D7] rounded-3xl p-6 shadow-xl">
            
            {/* Demo Header Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D1E2D7] mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveDemoTab('timeline')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeDemoTab === 'timeline'
                      ? 'bg-[#00684A] text-white shadow-md'
                      : 'text-slate-700 hover:text-[#001E2B] hover:bg-[#E8F3EC]'
                  }`}
                >
                  <GitCommit className="w-4 h-4" />
                  <span>1. Decision Timeline Simulator</span>
                </button>

                <button
                  onClick={() => setActiveDemoTab('memory')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeDemoTab === 'memory'
                      ? 'bg-[#00684A] text-white shadow-md'
                      : 'text-slate-700 hover:text-[#001E2B] hover:bg-[#E8F3EC]'
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  <span>2. Semantic Memory Graph</span>
                </button>

                <button
                  onClick={() => setActiveDemoTab('chat')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeDemoTab === 'chat'
                      ? 'bg-[#00684A] text-white shadow-md'
                      : 'text-slate-700 hover:text-[#001E2B] hover:bg-[#E8F3EC]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>3. Temporal AI Chat</span>
                </button>
              </div>

              <button
                onClick={() => onNavigate(activeDemoTab === 'timeline' ? 'timeline' : activeDemoTab === 'memory' ? 'memory' : 'chat')}
                className="text-xs font-extrabold text-[#00684A] hover:text-[#023430] flex items-center gap-1"
              >
                <span>Launch Full Screen</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Demo Tab Contents */}
            {activeDemoTab === 'timeline' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-white border border-[#D1E2D7] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                        IMPACT: 9.2 / 10
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Decision #101 • Executed Today</span>
                    </div>
                    <h3 className="text-base font-bold text-[#001E2B]">
                      Migrate Core State Engine to Server-Sent Events (SSE)
                    </h3>
                  </div>

                  <button
                    onClick={() => onNavigate('timeline')}
                    className="px-4 py-2 rounded-xl bg-[#E8F3EC] hover:bg-[#00684A] hover:text-white border border-[#C9DFD2] text-[#00684A] text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulate Alternate Choice</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-white border-2 border-[#00684A] shadow-xs">
                    <div className="text-xs font-bold text-[#00684A] mb-1">✓ Option A: HTTP/2 SSE (Selected)</div>
                    <p className="text-xs text-slate-700 font-medium">Reduced idle infrastructure costs by 38%, simplified Cloud Run scaling.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/70 border border-[#D1E2D7] text-slate-600">
                    <div className="text-xs font-bold text-slate-800 mb-1">Option B: WebSocket Cluster</div>
                    <p className="text-xs text-slate-600">Requires stateful sticky sessions + Redis pub/sub adapter overhead.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/70 border border-[#D1E2D7] text-slate-600">
                    <div className="text-xs font-bold text-slate-800 mb-1">Option C: gRPC Web Stream</div>
                    <p className="text-xs text-slate-600">Binary efficiency but higher client proxy configuration burden.</p>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === 'memory' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-[#D1E2D7]">
                  <Search className="w-4 h-4 text-[#00684A] ml-2" />
                  <input
                    type="text"
                    value={demoQuery}
                    onChange={(e) => setDemoQuery(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#001E2B] font-semibold focus:outline-none"
                    placeholder="Search memory vault..."
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#C9DFD2] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]">
                        DECISION MEMORY
                      </span>
                      <span className="text-xs font-bold text-[#001E2B]">PostgreSQL vs DynamoDB for Timeline Store</span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-[#00684A]">96% Retention Score</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Decided on PostgreSQL + TimescaleDB extension for event logs due to relational query needs for temporal decision trees and schema flexibility under 50k writes/sec.
                  </p>
                </div>
              </div>
            )}

            {activeDemoTab === 'chat' && (
              <div className="space-y-3 animate-fade-in">
                <div className="p-3.5 rounded-2xl bg-white border border-[#D1E2D7] text-xs text-slate-800 font-medium">
                  <span className="font-bold text-[#00684A]">User:</span> What was the rationale for choosing SSE over WebSockets?
                </div>
                <div className="p-3.5 rounded-2xl bg-[#E8F3EC] border border-[#C9DFD2] text-xs text-slate-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-[#00684A]" />
                    <span className="font-extrabold text-[#00684A]">Chrono-Reasoning 2.0:</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-800">Recalled 3 Memory Contexts</span>
                  </div>
                  <p className="leading-relaxed text-slate-800 font-medium">
                    SSE eliminated TCP sticky session overhead, saving <strong className="text-[#00684A]">38% on infrastructure</strong> while simplifying Cloud Run deployment.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* 4 Core Platform Pillars */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#001E2B] mb-4">
            Built for High-Velocity Thinking
          </h2>
          <p className="text-slate-600 text-base max-w-2xl mx-auto font-medium">
            Traditional AI chats forget context after a session. ChronoMind builds an interconnected memory graph that evolves with your decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard glowColor="emerald" className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F3EC] border border-[#C9DFD2] flex items-center justify-center text-[#00684A] mb-6 shadow-xs">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#001E2B] mb-2">1. Memory Vault</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              Long-term semantic memory storage with decay tracking, custom retention meters, and zero-knowledge encryption.
            </p>
            <button onClick={() => onNavigate('memory')} className="text-xs font-bold text-[#00684A] hover:text-[#023430] flex items-center gap-1">
              <span>View Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </GlassCard>

          <GlassCard glowColor="amber" className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-6 shadow-xs">
              <GitCommit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#001E2B] mb-2">2. Decision Timeline</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              Simulate counterfactual scenarios and evaluate projected risk indices before executing critical roadmap items.
            </p>
            <button onClick={() => onNavigate('timeline')} className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1">
              <span>Simulate Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </GlassCard>

          <GlassCard glowColor="cyan" className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 mb-6 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#001E2B] mb-2">3. Temporal AI Chat</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              Chat with Chrono-Flash or Chrono-Reasoning models that automatically cite pinned memories and decision nodes.
            </p>
            <button onClick={() => onNavigate('chat')} className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1">
              <span>Start Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </GlassCard>

          <GlassCard glowColor="emerald" className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F3EC] border border-[#C9DFD2] flex items-center justify-center text-[#00684A] mb-6 shadow-xs">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#001E2B] mb-2">4. Cognitive Matrix</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              Prioritize tasks based on your current cognitive fatigue level and AI time-slot recommendations.
            </p>
            <button onClick={() => onNavigate('tasks')} className="text-xs font-bold text-[#00684A] hover:text-[#023430] flex items-center gap-1">
              <span>Manage Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </GlassCard>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white/90 border-t border-[#D1E2D7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#001E2B] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 text-sm max-w-lg mx-auto mb-8 font-medium">
              Start with solo cognitive recall or scale up to multi-user team memory graphs.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center gap-3 p-1.5 rounded-2xl bg-[#F0F5F2] border border-[#D1E2D7]">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  !isAnnual ? 'bg-[#00684A] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isAnnual ? 'bg-[#00684A] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {mockPricingPlans.map((plan) => {
              const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;

              return (
                <div
                  key={plan.id}
                  className={`
                    relative rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between bg-white
                    ${
                      plan.recommended
                        ? 'border-2 border-[#00684A] shadow-xl shadow-emerald-800/10 scale-105'
                        : 'border border-[#D1E2D7] shadow-xs hover:border-[#00684A]'
                    }
                  `}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#00684A] text-white text-[11px] font-extrabold tracking-wider uppercase shadow-md">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-extrabold text-[#001E2B] mb-2">{plan.name}</h3>
                    <p className="text-xs text-slate-600 min-h-[36px] leading-relaxed mb-6 font-medium">
                      {plan.description}
                    </p>

                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-extrabold font-mono text-[#001E2B]">${price}</span>
                      <span className="text-xs text-slate-500 font-medium">/ month</span>
                      {isAnnual && <span className="text-[10px] text-[#00684A] ml-2 font-mono font-bold">billed annually</span>}
                    </div>

                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                          <Check className="w-4 h-4 text-[#00684A] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`
                      w-full py-3.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2
                      ${
                        plan.recommended
                          ? 'bg-[#00684A] hover:bg-[#023430] text-white shadow-md'
                          : 'bg-[#F0F5F2] hover:bg-[#E8F3EC] text-[#001E2B] border border-[#D1E2D7]'
                      }
                    `}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Modern Impressive Footer */}
      <Footer onNavigate={onNavigate} />

    </div>
  );
};
