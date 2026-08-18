import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Mic, 
  FileText, 
  Clock, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  History, 
  UserCheck, 
  CheckCircle2, 
  Search,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Tag,
  Calendar,
  Layers
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import aiService from '../../services/aiService';

// Default initial memory facts fallback if server is empty
const defaultActiveMemories = {
  name: { memoryId: 'mem_001', key: 'name', value: 'Aradhana', category: 'personal', source: 'voice', status: 'active', createdAt: '2026-08-06T10:00:00.000Z', updatedAt: '2026-08-06T10:00:00.000Z' },
  college: { memoryId: 'mem_002', key: 'college', value: 'LU', category: 'education', source: 'text', status: 'active', createdAt: '2026-08-06T10:05:00.000Z', updatedAt: '2026-08-06T10:05:00.000Z' },
  skills: { memoryId: 'mem_003', key: 'skills', value: 'MERN Stack', category: 'education', source: 'voice', status: 'active', createdAt: '2026-08-07T09:15:00.000Z', updatedAt: '2026-08-07T09:15:00.000Z' },
  goals: { memoryId: 'mem_004', key: 'goals', value: 'Full Stack Developer', category: 'goals', source: 'text', status: 'active', createdAt: '2026-08-07T09:30:00.000Z', updatedAt: '2026-08-07T09:30:00.000Z' },
};

const defaultTimeline = [
  { memoryId: 'mem_003', key: 'skills', value: 'MERN Stack', category: 'education', source: 'voice', status: 'active', createdAt: '2026-08-07T09:15:00.000Z', updatedAt: '2026-08-07T09:15:00.000Z' },
  { memoryId: 'mem_004', key: 'goals', value: 'Full Stack Developer', category: 'goals', source: 'text', status: 'active', createdAt: '2026-08-07T09:30:00.000Z', updatedAt: '2026-08-07T09:30:00.000Z' },
  { memoryId: 'mem_002', key: 'college', value: 'LU', category: 'education', source: 'text', status: 'active', createdAt: '2026-08-06T10:05:00.000Z', updatedAt: '2026-08-06T10:05:00.000Z' },
  { memoryId: 'mem_001', key: 'name', value: 'Aradhana', category: 'personal', source: 'voice', status: 'active', createdAt: '2026-08-06T10:00:00.000Z', updatedAt: '2026-08-06T10:00:00.000Z' },
];

const defaultHistoryGrouped = {
  name: {
    key: 'name',
    active: { memoryId: 'mem_001', value: 'Aradhana', status: 'active' },
    history: [
      { memoryId: 'mem_000c', value: 'Shaalu', status: 'inactive', createdAt: '2026-08-05T12:00:00.000Z' },
      { memoryId: 'mem_000b', value: 'Kittu', status: 'inactive', createdAt: '2026-08-04T12:00:00.000Z' },
      { memoryId: 'mem_000a', value: 'Radha', status: 'inactive', createdAt: '2026-08-03T12:00:00.000Z' },
    ],
    allValues: ['Radha', 'Kittu', 'Shaalu', 'Aradhana']
  }
};

export const AIBrainDashboardScreen = ({ onNavigate }) => {
  const [activeFacts, setActiveFacts] = useState(defaultActiveMemories);
  const [timeline, setTimeline] = useState(defaultTimeline);
  const [historyGrouped, setHistoryGrouped] = useState(defaultHistoryGrouped);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');

  // Add Memory Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addKey, setAddKey] = useState('skills');
  const [addValue, setAddValue] = useState('');
  const [addCategory, setAddCategory] = useState('education');
  const [addSource, setAddSource] = useState('voice');
  const [submitting, setSubmitting] = useState(false);

  // Load data from backend
  const loadBrainData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.fetchMemoryFacts();
      if (data && data.success) {
        if (data.activeFacts && Object.keys(data.activeFacts).length > 0) {
          setActiveFacts(data.activeFacts);
        }
        if (data.timeline && data.timeline.length > 0) {
          setTimeline(data.timeline);
        }
        if (data.historyGrouped && Object.keys(data.historyGrouped).length > 0) {
          setHistoryGrouped(data.historyGrouped);
        }
      }
    } catch (err) {
      console.warn('Backend fetch error, using active state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrainData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addKey.trim() || !addValue.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const newFact = await aiService.addMemoryFact(
        addKey.trim().toLowerCase(),
        addValue.trim(),
        addCategory,
        addSource
      );

      setSuccessMsg(`Successfully stored memory: "${addKey}: ${addValue}" (${newFact?.memoryId || 'new'})`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowAddModal(false);
      setAddValue('');
      await loadBrainData();
    } catch (err) {
      setError(err.message || 'Failed to add memory fact');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Filtered timeline
  const filteredTimeline = timeline.filter((item) => {
    const matchesSource = filterSource === 'all' || (item.source || '').toLowerCase() === filterSource.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (item.key || '').toLowerCase().includes(query) ||
      (item.value || '').toLowerCase().includes(query) ||
      (item.category || '').toLowerCase().includes(query) ||
      (item.memoryId || '').toLowerCase().includes(query);

    return matchesSource && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#E8F3EC] border border-[#C9DFD2] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#00684A] text-white flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" />
              AI BRAIN DASHBOARD
            </span>
            <span className="text-xs text-[#00684A] font-mono font-bold">Unique Memory ID Index</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001E2B] tracking-tight">
            AI Brain & Memory Timeline
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Understand exactly what the AI remembers about you, explore memory history timelines, and inspect conflict resolution.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadBrainData}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#D1E2D7] text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#00684A] ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Memory Store</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Update Memory</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Active Memory Profile ("My Current Memories") */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#00684A]" />
            <h2 className="text-lg font-extrabold text-[#001E2B]">My Current Memories</h2>
          </div>
          <span className="text-xs font-mono font-bold text-[#00684A] bg-[#E8F3EC] px-3 py-1 rounded-full border border-[#C9DFD2]">
            {Object.keys(activeFacts).length} Active Memory Node(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(activeFacts).map(([k, item]) => {
            const factObj = typeof item === 'object' ? item : { value: String(item), key: k };
            const isVoice = (factObj.source || 'voice').toLowerCase() === 'voice';

            return (
              <GlassCard
                key={k}
                glowColor="emerald"
                className="p-5 bg-white border-[#D1E2D7] relative overflow-hidden group hover:border-[#00684A] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#00684A]" />
                    {factObj.category || 'personal'}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                    isVoice ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {isVoice ? <Mic className="w-3 h-3 text-amber-600" /> : <FileText className="w-3 h-3 text-blue-600" />}
                    {isVoice ? 'Voice' : 'Text'}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1 font-bold">
                  {k.replace('_', ' ')}:
                </div>

                <div className="text-base font-extrabold text-[#001E2B] break-words group-hover:text-[#00684A] transition-colors">
                  {factObj.value}
                </div>

                {factObj.memoryId && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>ID: <strong className="text-slate-600">{factObj.memoryId}</strong></span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Memory Timeline */}
      <div className="space-y-4 pt-4 border-t border-[#D1E2D7]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00684A]" />
            <h2 className="text-lg font-extrabold text-[#001E2B]">Memory Timeline</h2>
          </div>

          {/* Timeline Search & Filter Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#F0F5F2] px-3 py-1.5 rounded-xl border border-[#D1E2D7]">
              <Search className="w-3.5 h-3.5 text-[#00684A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search timeline..."
                className="bg-transparent text-xs text-[#001E2B] font-medium placeholder-slate-400 focus:outline-none w-32 sm:w-40"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#F0F5F2] p-1 rounded-xl border border-[#D1E2D7] text-xs font-bold">
              {['all', 'voice', 'text'].map((src) => (
                <button
                  key={src}
                  onClick={() => setFilterSource(src)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    filterSource === src ? 'bg-[#00684A] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>

        <GlassCard hoverEffect={false} className="p-6 bg-white border-[#D1E2D7] space-y-6">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D1E2D7]">
            {filteredTimeline.map((item, index) => {
              const isVoice = (item.source || 'voice').toLowerCase() === 'voice';
              const isUpdated = item.status === 'inactive' || index > 0;
              const dateDisplay = formatDate(item.createdAt || item.updatedAt);

              return (
                <div key={item.memoryId || index} className="relative group">
                  {/* Circle Node Icon */}
                  <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                    item.status === 'active'
                      ? 'bg-[#00684A] border-white text-white shadow-xs'
                      : 'bg-slate-200 border-white text-slate-500'
                  }`}>
                    {isVoice ? <Mic className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  </div>

                  {/* Memory Timeline Card Box */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    item.status === 'active'
                      ? 'bg-[#F0F5F2] border-[#C9DFD2] shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 opacity-80'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#00684A]" />
                          {dateDisplay}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          isVoice ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {isVoice ? '🎙 Voice Memory Added' : '✍️ Text Memory Added'}
                        </span>

                        {isUpdated && item.status === 'inactive' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700 flex items-center gap-1">
                            🧠 Memory Superseded
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono font-extrabold text-[#00684A] bg-white px-2 py-0.5 rounded-lg border border-[#C9DFD2]">
                        Memory ID: {item.memoryId}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-slate-500">
                        {item.key}:
                      </span>
                      <span className="text-sm font-extrabold text-[#001E2B]">
                        {item.value}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Category: <strong className="text-slate-700">{item.category}</strong></span>
                      <span className={`font-bold ${item.status === 'active' ? 'text-emerald-700' : 'text-slate-400'}`}>
                        Status: {item.status === 'active' ? '● Active' : '○ Historical'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTimeline.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs font-medium">
                No memories match your filter criteria.
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* SECTION 3: Memory History */}
      <div className="space-y-4 pt-4 border-t border-[#D1E2D7]">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#00684A]" />
          <h2 className="text-lg font-extrabold text-[#001E2B]">Memory History</h2>
        </div>

        <p className="text-xs text-slate-600 font-medium">
          Chronological sequence showing previous inactive memories updated over time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(historyGrouped).map(([keyName, group]) => {
            const activeVal = group.active?.value || activeFacts[keyName]?.value || 'N/A';
            const historyList = group.history || [];
            const allVals = group.allValues && group.allValues.length > 0
              ? group.allValues 
              : [...historyList.map(h => h.value), activeVal].filter(Boolean);

            // Deduplicate sequentially
            const sequence = Array.from(new Set(allVals));

            return (
              <GlassCard
                key={keyName}
                hoverEffect={false}
                className="p-5 bg-white border-[#D1E2D7] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00684A]" />
                    <h3 className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#001E2B]">
                      {keyName} History:
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">
                    {sequence.length} Version(s)
                  </span>
                </div>

                {/* Evolution Flow Chain */}
                <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                  {sequence.map((val, idx) => {
                    const isCurrent = val === activeVal;
                    return (
                      <React.Fragment key={idx}>
                        <div className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#E8F3EC] text-[#00684A] border-[#C9DFD2] font-extrabold shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 line-through opacity-75'
                        }`}>
                          {val}
                          {isCurrent && <span className="ml-1 text-[10px] text-[#00684A] font-mono font-normal">(Current)</span>}
                        </div>

                        {idx < sequence.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Detailed Inactive List */}
                {historyList.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Inactive Log:
                    </span>
                    {historyList.map((hItem) => (
                      <div key={hItem.memoryId} className="flex items-center justify-between text-[11px] font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
                        <span>• Value: <strong className="text-slate-800">{hItem.value}</strong></span>
                        <span className="text-[10px] text-slate-400">{hItem.memoryId || 'inactive'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Add / Update Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#D1E2D7] rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#00684A]" />
                <h2 className="text-base font-bold text-[#001E2B]">Store / Update Memory Fact</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-[#001E2B]">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Memory Key</label>
                <input
                  type="text"
                  required
                  value={addKey}
                  onChange={(e) => setAddKey(e.target.value)}
                  placeholder="e.g. name, college, skills, goals"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-semibold text-[#001E2B] focus:outline-none focus:border-[#00684A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Memory Value</label>
                <input
                  type="text"
                  required
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                  placeholder="e.g. MERN Stack, Full Stack Developer"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] focus:outline-none focus:border-[#00684A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#001E2B] mb-1">Category</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-semibold text-[#001E2B] focus:outline-none focus:border-[#00684A]"
                  >
                    <option value="personal">Personal</option>
                    <option value="education">Education</option>
                    <option value="location">Location</option>
                    <option value="goals">Goals</option>
                    <option value="preferences">Preferences</option>
                    <option value="tasks">Tasks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001E2B] mb-1">Source Input</label>
                  <select
                    value={addSource}
                    onChange={(e) => setAddSource(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-semibold text-[#001E2B] focus:outline-none focus:border-[#00684A]"
                  >
                    <option value="voice">Voice</option>
                    <option value="text">Text</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>
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
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Store Fact'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
