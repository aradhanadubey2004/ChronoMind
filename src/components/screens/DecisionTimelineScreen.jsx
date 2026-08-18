import React, { useState } from 'react';
import { 
  GitCommit, 
  Sparkles, 
  Plus, 
  Brain, 
  X 
} from 'lucide-react';
import { mockDecisions } from '../../data/mockData';
import { GlassCard } from '../common/GlassCard';

export const DecisionTimelineScreen = ({ onNavigate }) => {
  const [decisions, setDecisions] = useState(mockDecisions);
  const [activeTab, setActiveTab] = useState('All');
  const [simulatingDecision, setSimulatingDecision] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);

  // New Decision Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImpact, setNewImpact] = useState(8.5);

  const filteredDecisions = decisions.filter(d => activeTab === 'All' || d.status === activeTab);

  const handleRunSimulation = (choice) => {
    setSimulationResult(
      `AI Counterfactual Prediction for [${choice.label}]:\n\n` +
      `• Projected Outcome: ${choice.projectedOutcome}\n` +
      `• AI Confidence Score: ${choice.aiConfidence}%\n` +
      `• Calculated Risk Index: ${choice.riskIndex}/100\n` +
      `• Recommended Mitigation: Maintain automated regression testing suite and deploy canary instances.`
    );
  };

  const handleCreateDecision = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = {
      id: `dec_${Date.now()}`,
      title: newTitle,
      description: newDescription,
      timestamp: 'Just now',
      impactScore: newImpact,
      riskLevel: newImpact > 8 ? 'High' : 'Medium',
      status: 'Evaluating',
      tags: ['Roadmap', 'AI Simulated'],
      linkedMemoriesCount: 2,
      simulatedScenarioCount: 1,
      author: 'Alex Vance',
      choices: [
        {
          id: 'c1',
          label: 'Primary Proposed Strategy',
          selected: false,
          projectedOutcome: 'Accelerates roadmap delivery by 2.5 weeks.',
          aiConfidence: 89,
          riskIndex: 25
        },
        {
          id: 'c2',
          label: 'Conservative Incremental Rollout',
          selected: false,
          projectedOutcome: 'Lower operational risk, but adds 10 days of staging testing.',
          aiConfidence: 94,
          riskIndex: 12
        }
      ]
    };

    setDecisions([created, ...decisions]);
    setShowAddModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-[#E8F3EC] border border-[#C9DFD2] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#00684A] text-white">
              TEMPORAL TREE ACTIVE
            </span>
            <span className="text-xs text-[#00684A] font-mono font-bold">3 Active Decision Branches</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001E2B] tracking-tight">
            Decision Timeline & Scenario Simulator
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Track chronological decision trees, simulate counterfactual alternate outcomes, and evaluate AI risk projections.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 rounded-2xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Decision Tree</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D1E2D7] pb-3">
        {['All', 'Executed', 'Evaluating', 'Simulated'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-[#00684A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#001E2B] bg-[#F0F5F2] border border-[#D1E2D7]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chronological Timeline Display */}
      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#C9DFD2]">
        
        {filteredDecisions.map((dec) => (
          <div key={dec.id} className="relative group">
            
            {/* Timeline Node Dot */}
            <div className="absolute -left-6 top-5 w-5 h-5 rounded-full bg-white border-2 border-[#00684A] flex items-center justify-center shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00684A]" />
            </div>

            <GlassCard hoverEffect={false} className="p-6 bg-white border-[#D1E2D7] space-y-4">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#D1E2D7] pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F0F5F2] text-slate-700">
                      ID: {dec.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      dec.status === 'Executed' ? 'bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]' :
                      dec.status === 'Evaluating' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      'bg-emerald-50 text-[#00684A] border border-[#C9DFD2]'
                    }`}>
                      {dec.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      dec.riskLevel === 'Critical' ? 'text-amber-800 bg-amber-100' :
                      dec.riskLevel === 'High' ? 'text-amber-700 bg-amber-50' :
                      'text-[#00684A] bg-[#E8F3EC]'
                    }`}>
                      Risk: {dec.riskLevel}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#001E2B]">{dec.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-mono font-extrabold text-amber-700">
                      Impact: {dec.impactScore} / 10
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono font-medium">{dec.timestamp}</div>
                  </div>

                  <button
                    onClick={() => {
                      setSimulatingDecision(dec);
                      setSimulationResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Simulate Scenario</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {dec.description}
              </p>

              {/* Decision Choices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {dec.choices.map((choice) => (
                  <div
                    key={choice.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      choice.selected
                        ? 'bg-[#E8F3EC] border-[#00684A] shadow-xs'
                        : 'bg-[#F0F5F2] border-[#D1E2D7] hover:border-[#00684A]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold ${choice.selected ? 'text-[#00684A]' : 'text-[#001E2B]'}`}>
                        {choice.selected ? '✓ ' : ''}{choice.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        Conf: {choice.aiConfidence}%
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium leading-snug mb-2">
                      {choice.projectedOutcome}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#D1E2D7]">
                      <span className="text-slate-500 font-bold">Risk Index:</span>
                      <span className={`font-extrabold ${choice.riskIndex > 40 ? 'text-amber-700' : 'text-[#00684A]'}`}>
                        {choice.riskIndex} / 100
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Metadata */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-[#D1E2D7] font-medium">
                <div className="flex items-center gap-3">
                  <span>Author: {dec.author}</span>
                  <span>•</span>
                  <span>Linked Memories: {dec.linkedMemoriesCount}</span>
                </div>

                <div className="flex items-center gap-2">
                  {dec.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-[#F0F5F2] text-slate-700 font-semibold">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

            </GlassCard>
          </div>
        ))}

      </div>

      {/* Simulator Modal */}
      {simulatingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-[#D1E2D7] rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-[#D1E2D7] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-mono text-amber-800 font-bold">TEMPORAL SIMULATOR</span>
                </div>
                <h2 className="text-lg font-bold text-[#001E2B]">{simulatingDecision.title}</h2>
              </div>
              <button onClick={() => setSimulatingDecision(null)} className="text-slate-400 hover:text-[#001E2B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Select Option to Predict Outcome:
              </h3>

              <div className="space-y-2">
                {simulatingDecision.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleRunSimulation(choice)}
                    className="w-full p-3 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] hover:border-[#00684A] text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#001E2B] group-hover:text-[#00684A]">
                        {choice.label}
                      </span>
                      <span className="text-[10px] font-mono text-amber-800 font-bold">
                        Test Risk ({choice.riskIndex}/100)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">{choice.projectedOutcome}</p>
                  </button>
                ))}
              </div>
            </div>

            {simulationResult && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Brain className="w-4 h-4 text-amber-700" />
                  <span>AI Simulation Output</span>
                </div>
                <pre className="text-xs font-sans text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {simulationResult}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D1E2D7]">
              <button
                onClick={() => setSimulatingDecision(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close Simulator
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Decision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-[#D1E2D7] rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-3">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-[#00684A]" />
                <h2 className="text-base font-bold text-[#001E2B]">Create New Decision Tree</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-[#001E2B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Decision Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Adopt Serverless Multi-Region Cloud Run vs GKE"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00684A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Context & Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the trade-offs, team impact, and key requirements..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00684A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#001E2B]">Target Impact Rating</label>
                  <span className="text-xs font-mono font-bold text-amber-800">{newImpact} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={newImpact}
                  onChange={(e) => setNewImpact(Number(e.target.value))}
                  className="w-full accent-[#00684A] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D1E2D7]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs shadow-md"
                >
                  Create Tree
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
