import React, { useState } from 'react';
import { 
  Brain, 
  Search, 
  Pin, 
  Sparkles, 
  Plus, 
  Sliders, 
  X, 
  Check, 
  Trash2, 
  ChevronRight, 
  GitCommit, 
  CheckSquare, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Zap
} from 'lucide-react';
import { mockMemories } from '../../data/mockData';
import { GlassCard } from '../common/GlassCard';
import aiService from '../../services/aiService';

export const ConversationMemoryScreen = ({ onNavigate }) => {
  const [memories, setMemories] = useState(mockMemories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minRetentionFilter, setMinRetentionFilter] = useState(0);
  const [activeMemoryDetail, setActiveMemoryDetail] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // AI Meeting Workflow State
  const [showAnalyzerModal, setShowAnalyzerModal] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState(
    `Sarah (Product Lead): Welcome everyone. Today we need to decide on our database architecture for ChronoMind's temporal memory index and finalize our team action items.
Alex (Principal Architect): I strongly recommend PostgreSQL with TimescaleDB extension for time-series memory chunks. DynamoDB lacks flexible relational joins for decision graph queries.
Elena (Engineering Lead): Agreed. PostgreSQL gives us ACID compliance for transactions and seamless indexing for vector embeddings.
Sarah: Decision confirmed: We will adopt PostgreSQL + TimescaleDB. Alex, please lead the schema setup by Friday.
Elena: I'll handle the API integration layer for summary generation, decision extraction, and task scheduling using Gemini API by next Monday.
Sarah: Perfect. Let's make sure all API endpoints are protected with JWT auth.`
  );

  // Workflow Results
  const [aiSummary, setAiSummary] = useState(null);
  const [aiDecisions, setAiDecisions] = useState([]);
  const [aiTasks, setAiTasks] = useState([]);

  // Loading & Error states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccessMsg, setApiSuccessMsg] = useState(null);

  // New Memory Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCategory, setNewCategory] = useState('insight');
  const [newTags, setNewTags] = useState('Architecture, AI');

  const filteredMemories = memories.filter((mem) => {
    const matchesCategory = selectedCategory === 'all' || mem.category === selectedCategory;
    const matchesSearch = mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          mem.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          mem.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRetention = mem.retentionScore >= minRetentionFilter;
    return matchesCategory && matchesSearch && matchesRetention;
  });

  // AI Service API Handlers
  const handleGenerateSummary = async () => {
    if (!transcriptInput.trim()) return;
    setLoadingSummary(true);
    setApiError(null);
    try {
      const summaryRes = await aiService.generateMeetingSummary(transcriptInput);
      setAiSummary(summaryRes);
      setApiSuccessMsg('Meeting summary generated successfully!');
      setTimeout(() => setApiSuccessMsg(null), 3000);
    } catch (err) {
      setApiError(err.message || 'Error generating meeting summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleExtractDecisions = async () => {
    if (!transcriptInput.trim()) return;
    setLoadingDecisions(true);
    setApiError(null);
    try {
      const decisionsRes = await aiService.extractDecisions(transcriptInput);
      setAiDecisions(decisionsRes);
      setApiSuccessMsg(`${decisionsRes.length} decision(s) extracted successfully!`);
      setTimeout(() => setApiSuccessMsg(null), 3000);
    } catch (err) {
      setApiError(err.message || 'Error extracting decisions.');
    } finally {
      setLoadingDecisions(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!transcriptInput.trim()) return;
    setLoadingTasks(true);
    setApiError(null);
    try {
      const tasksRes = await aiService.generateTasks(transcriptInput);
      setAiTasks(tasksRes);
      setApiSuccessMsg(`${tasksRes.length} task(s) generated successfully!`);
      setTimeout(() => setApiSuccessMsg(null), 3000);
    } catch (err) {
      setApiError(err.message || 'Error generating tasks.');
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleRunAllAi = async () => {
    if (!transcriptInput.trim()) return;
    setApiError(null);
    await handleGenerateSummary();
    await handleExtractDecisions();
    await handleGenerateTasks();
  };

  const handleAddMemory = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    const createdItem = {
      id: `mem_custom_${Date.now()}`,
      title: newTitle,
      summary: newSummary,
      category: newCategory,
      retentionScore: 100,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: 'Just now',
      contextSnippet: newSummary,
      relevanceScore: 100,
      isPinned: true,
      decayDays: 180,
      sourceSession: 'User Vault Input'
    };

    setMemories([createdItem, ...memories]);
    setShowAddModal(false);
    setNewTitle('');
    setNewSummary('');
  };

  const togglePin = (id, e) => {
    e.stopPropagation();
    setMemories(memories.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m));
  };

  const deleteMemory = (id) => {
    setMemories(memories.filter(m => m.id !== id));
    if (activeMemoryDetail?.id === id) setActiveMemoryDetail(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#E8F3EC] border border-[#C9DFD2] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#00684A] text-white">
              1,420 INDEXED NODES
            </span>
            <span className="text-xs text-[#00684A] font-mono font-bold">Zero-Knowledge Envelope Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001E2B] tracking-tight">
            Conversation Memory Vault
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Semantic memory graph capturing technical choices, insights, and preferences with retention decay tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAnalyzerModal(true)}
            className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-[#00684A] text-[#00684A] font-extrabold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#00684A]" />
            <span>AI Meeting Analyzer</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 rounded-2xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Index Memory Node</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <GlassCard hoverEffect={false} className="p-4 bg-white border-[#D1E2D7] space-y-4">
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          {/* Search Box */}
          <div className="flex items-center gap-2.5 flex-1 w-full bg-[#F0F5F2] px-3.5 py-2.5 rounded-xl border border-[#D1E2D7] focus-within:border-[#00684A] transition-colors">
            <Search className="w-4 h-4 text-[#00684A] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, or tag (e.g. 'PostgreSQL', 'MFA', 'Pricing')..."
              className="w-full bg-transparent text-xs text-[#001E2B] font-medium placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-[#001E2B]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Retention Threshold Filter Slider */}
          <div className="flex items-center gap-3 w-full md:w-auto bg-[#F0F5F2] px-3.5 py-2 rounded-xl border border-[#D1E2D7]">
            <Sliders className="w-4 h-4 text-[#00684A] shrink-0" />
            <div className="text-[11px] text-slate-700 font-medium whitespace-nowrap">
              Min Retention: <strong className="font-mono text-[#00684A] font-extrabold">{minRetentionFilter}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minRetentionFilter}
              onChange={(e) => setMinRetentionFilter(Number(e.target.value))}
              className="w-24 accent-[#00684A] cursor-pointer"
            />
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#D1E2D7]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono mr-2">
            Categories:
          </span>

          {['all', 'insight', 'decision', 'code', 'strategy', 'preference'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === cat
                  ? 'bg-[#00684A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#001E2B] bg-[#F0F5F2] border border-[#D1E2D7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </GlassCard>

      {/* Memory Vault Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMemories.map((mem) => (
          <GlassCard
            key={mem.id}
            onClick={() => setActiveMemoryDetail(mem)}
            glowColor="emerald"
            className={`p-5 relative group bg-white border-[#D1E2D7] ${mem.isPinned ? 'border-[#00684A] shadow-md ring-1 ring-[#00684A]/20' : ''}`}
          >
            {/* Top Bar */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                mem.category === 'decision' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                'bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]'
              }`}>
                {mem.category}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => togglePin(mem.id, e)}
                  title={mem.isPinned ? 'Unpin Memory' : 'Pin Memory'}
                  className={`p-1 rounded-lg transition-colors ${
                    mem.isPinned ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <div className="text-right">
                  <div className="text-xs font-mono font-extrabold text-[#00684A]">
                    {mem.retentionScore}%
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-[#001E2B] mb-2 leading-snug group-hover:text-[#00684A] transition-colors">
              {mem.title}
            </h3>

            {/* Summary */}
            <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed font-medium">
              {mem.summary}
            </p>

            {/* Tags & Meta */}
            <div className="pt-3 border-t border-[#D1E2D7] flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-1.5 flex-wrap">
                {mem.tags.slice(0, 2).map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-[#F0F5F2] text-slate-700 font-semibold">
                    #{t}
                  </span>
                ))}
              </div>
              <span className="font-medium">{mem.createdAt}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Memory Detail Side Drawer / Modal */}
      {activeMemoryDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-[#D1E2D7] rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-[#D1E2D7] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2] uppercase">
                    {activeMemoryDetail.category}
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-bold">ID: {activeMemoryDetail.id}</span>
                </div>
                <h2 className="text-lg font-bold text-[#001E2B]">{activeMemoryDetail.title}</h2>
              </div>

              <button
                onClick={() => setActiveMemoryDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-[#001E2B] hover:bg-[#F0F5F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Summary Note</h4>
              <p className="text-xs text-slate-700 font-medium leading-relaxed p-3 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7]">
                {activeMemoryDetail.summary}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Raw Context Snippet</h4>
              <pre className="text-[11px] font-mono text-[#00684A] p-3 rounded-xl bg-[#E8F3EC] border border-[#C9DFD2] whitespace-pre-wrap overflow-x-auto font-bold">
                {activeMemoryDetail.contextSnippet}
              </pre>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7]">
                <span className="text-slate-500 block text-[10px] font-bold">Retention Score</span>
                <span className="text-[#00684A] font-extrabold">{activeMemoryDetail.retentionScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7]">
                <span className="text-slate-500 block text-[10px] font-bold">Source Session</span>
                <span className="text-slate-800 font-semibold truncate block">{activeMemoryDetail.sourceSession}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7]">
                <span className="text-slate-500 block text-[10px] font-bold">Decay Horizon</span>
                <span className="text-slate-800 font-semibold">{activeMemoryDetail.decayDays} days</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#D1E2D7]">
              <button
                onClick={() => deleteMemory(activeMemoryDetail.id)}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Node</span>
              </button>

              <button
                onClick={() => onNavigate('chat')}
                className="px-5 py-2.5 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
              >
                <span>Ask AI About This Memory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-[#D1E2D7] rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#00684A]" />
                <h2 className="text-base font-bold text-[#001E2B]">Index New Memory Node</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-[#001E2B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Memory Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Postgres vs DynamoDB for Timeline Event Log"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00684A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-semibold text-[#001E2B] focus:outline-none focus:border-[#00684A]"
                >
                  <option value="insight">Insight</option>
                  <option value="decision">Decision</option>
                  <option value="code">Code Snippet</option>
                  <option value="strategy">Strategy</option>
                  <option value="preference">Preference</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Detailed Context / Note</label>
                <textarea
                  required
                  rows={4}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Summarize the core technical decision, rationale, or insight..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00684A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Database, Performance, Cloud"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00684A]"
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
                  Save to Vault
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* AI Meeting Workflow Analyzer Modal */}
      {showAnalyzerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl bg-white border border-[#D1E2D7] rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#D1E2D7] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2] uppercase">
                    GEMINI AI WORKFLOW API INTEGRATED
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#001E2B] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00684A]" />
                  <span>AI Meeting Transcript Analyzer</span>
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Enter or paste raw meeting transcript to generate executive summaries, extract key decisions, and derive scheduled action items.
                </p>
              </div>

              <button
                onClick={() => setShowAnalyzerModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-[#001E2B] hover:bg-[#F0F5F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Banners */}
            {apiError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{apiError}</span>
              </div>
            )}

            {apiSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-[#E8F3EC] border border-[#C9DFD2] text-[#00684A] text-xs flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 shrink-0 text-[#00684A]" />
                <span>{apiSuccessMsg}</span>
              </div>
            )}

            {/* Transcript Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#001E2B]">
                  Meeting Conversation Transcript
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTranscriptInput(
                      `Sarah (Product Lead): Welcome everyone. Today we need to decide on our database architecture for ChronoMind's temporal memory index and finalize our team action items.\nAlex (Principal Architect): I strongly recommend PostgreSQL with TimescaleDB extension for time-series memory chunks. DynamoDB lacks flexible relational joins for decision graph queries.\nElena (Engineering Lead): Agreed. PostgreSQL gives us ACID compliance for transactions and seamless indexing for vector embeddings.\nSarah: Decision confirmed: We will adopt PostgreSQL + TimescaleDB. Alex, please lead the schema setup by Friday.\nElena: I'll handle the API integration layer for summary generation, decision extraction, and task scheduling using Gemini API by next Monday.\nSarah: Perfect. Let's make sure all API endpoints are protected with JWT auth.`
                    );
                  }}
                  className="text-[11px] font-mono text-[#00684A] font-bold hover:underline"
                >
                  Load Sample Transcript
                </button>
              </div>

              <textarea
                rows={6}
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                placeholder="Paste speaker transcript or dialogue notes here..."
                className="w-full p-4 rounded-2xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-mono text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00684A] leading-relaxed"
              />

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleGenerateSummary}
                  disabled={loadingSummary || !transcriptInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {loadingSummary ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>1. Generate Summary</span>
                </button>

                <button
                  onClick={handleExtractDecisions}
                  disabled={loadingDecisions || !transcriptInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {loadingDecisions ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GitCommit className="w-4 h-4" />
                  )}
                  <span>2. Extract Decisions</span>
                </button>

                <button
                  onClick={handleGenerateTasks}
                  disabled={loadingTasks || !transcriptInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {loadingTasks ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckSquare className="w-4 h-4" />
                  )}
                  <span>3. Generate Tasks</span>
                </button>

                <button
                  onClick={handleRunAllAi}
                  disabled={loadingSummary || loadingDecisions || loadingTasks || !transcriptInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50 transition-all ml-auto"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Run Full AI Pipeline</span>
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6 pt-4 border-t border-[#D1E2D7]">
              
              {/* 1. Summary Display */}
              {aiSummary && (
                <div className="p-5 rounded-2xl bg-[#E8F3EC] border border-[#C9DFD2] space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-[#C9DFD2] pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#00684A]" />
                      <h3 className="text-sm font-extrabold text-[#001E2B]">{aiSummary.title}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00684A] text-white">
                      {aiSummary.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#00684A] uppercase font-mono mb-1">Executive Summary</h4>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-[#C9DFD2]">
                      {aiSummary.summary}
                    </p>
                  </div>

                  {aiSummary.keyPoints && aiSummary.keyPoints.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#00684A] uppercase font-mono mb-1.5">Key Highlights</h4>
                      <ul className="space-y-1">
                        {aiSummary.keyPoints.map((kp, i) => (
                          <li key={i} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                            <span className="text-[#00684A] font-bold">•</span>
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiSummary.participants && aiSummary.participants.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-xs pt-2 border-t border-[#C9DFD2]">
                      <span className="text-slate-600 font-bold font-mono">Participants:</span>
                      {aiSummary.participants.map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white text-[#001E2B] font-semibold border border-[#C9DFD2] text-[11px]">
                          {p.name} {p.role ? `(${p.role})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Decisions Display */}
              {aiDecisions.length > 0 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-[#001E2B] uppercase tracking-wider font-mono flex items-center gap-2">
                      <GitCommit className="w-4 h-4 text-amber-700" />
                      <span>Extracted Decisions ({aiDecisions.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiDecisions.map((dec, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white border border-[#D1E2D7] shadow-2xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#001E2B]">{dec.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            dec.status === 'Executed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {dec.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-medium line-clamp-3">
                          {dec.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-slate-100 text-slate-500">
                          <span>Impact: <strong className="text-[#001E2B]">{dec.impactScore}/10</strong></span>
                          <span>Risk: <strong className="text-amber-800">{dec.riskLevel}</strong></span>
                          <span>Owner: <strong className="text-[#00684A]">{dec.author}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Tasks Display */}
              {aiTasks.length > 0 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-[#001E2B] uppercase tracking-wider font-mono flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-teal-700" />
                      <span>AI Generated Action Items ({aiTasks.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiTasks.map((t, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white border border-[#D1E2D7] shadow-2xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#001E2B]">{t.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]">
                            {t.energyNeeded}
                          </span>
                        </div>

                        {t.description && (
                          <p className="text-xs text-slate-600 font-medium">
                            {t.description}
                          </p>
                        )}

                        <div className="p-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-[11px] text-slate-700 space-y-1 font-mono">
                          <div className="flex items-center justify-between font-bold">
                            <span>AI Priority Score:</span>
                            <span className="text-[#00684A]">{t.priorityScore}/100</span>
                          </div>
                          {t.aiScheduleRecommendation && (
                            <div className="text-[10px] text-slate-500 font-sans font-medium">
                              💡 {t.aiScheduleRecommendation}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 font-sans">
                            <Calendar className="w-3 h-3 text-[#00684A]" />
                            <span>Due Date: {new Date(t.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-[#D1E2D7]">
              <button
                type="button"
                onClick={() => setShowAnalyzerModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white text-xs font-bold shadow-xs"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
