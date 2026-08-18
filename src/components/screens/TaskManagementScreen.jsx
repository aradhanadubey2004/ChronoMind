import React, { useState } from 'react';
import { 
  CheckSquare, 
  Flame, 
  Plus, 
  Clock, 
  Sparkles, 
  Zap, 
  CheckCircle, 
  Circle, 
  X
} from 'lucide-react';
import { mockTasks } from '../../data/mockData';
import { GlassCard } from '../common/GlassCard';

export const TaskManagementScreen = ({ onNavigate }) => {
  const [tasks, setTasks] = useState(mockTasks);
  const [filterEnergy, setFilterEnergy] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [autoScheduleNotice, setAutoScheduleNotice] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEnergy, setNewEnergy] = useState('High Focus');

  const filteredTasks = tasks.filter(t => filterEnergy === 'All' || t.energyNeeded === filterEnergy);

  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'completed' ? 'todo' : t.status === 'todo' ? 'in_progress' : 'completed';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleAutoSchedule = () => {
    setAutoScheduleNotice(true);
    setTimeout(() => setAutoScheduleNotice(false), 3000);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = {
      id: `t_${Date.now()}`,
      title: newTitle,
      description: newDesc,
      category: newEnergy === 'High Focus' ? 'Deep Work' : 'Quick Win',
      energyNeeded: newEnergy,
      priorityScore: Math.floor(Math.random() * 20) + 80,
      status: 'todo',
      dueDate: 'Tomorrow',
      estimatedMinutes: 45,
      memoryCount: 1,
      aiScheduleRecommendation: 'Recommended for tomorrow morning peak focus window'
    };

    setTasks([created, ...tasks]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-[#E8F3EC] border border-[#C9DFD2] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#00684A] text-white">
              COGNITIVE ENERGY MATRIX
            </span>
            <span className="text-xs text-[#00684A] font-mono font-bold">User Peak Window: 2:00 PM - 4:00 PM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001E2B] tracking-tight">
            AI Cognitive Task Matrix
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Tasks prioritized by cognitive energy friction, decision linkage, and optimal focus windows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoSchedule}
            className="px-4 py-3 rounded-2xl bg-white hover:bg-[#F0F5F2] border border-[#D1E2D7] text-[#00684A] font-bold text-xs shadow-2xs transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>AI Auto-Schedule Focus Slots</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-2xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {autoScheduleNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 animate-fade-in font-medium">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-700 shrink-0" />
            <span>AI Auto-Schedule complete! 2 Deep Work tasks mapped to your 2:00 PM peak cognitive window.</span>
          </div>
          <span className="font-mono text-[10px] text-amber-800 font-bold">100% Synced</span>
        </div>
      )}

      {/* Energy Filter Pills */}
      <div className="flex items-center gap-2 border-b border-[#D1E2D7] pb-3">
        <span className="text-xs font-mono font-bold text-slate-500 mr-2 uppercase">Filter Energy:</span>
        {['All', 'High Focus', 'Medium Flow', 'Low Energy / Quick'].map((energy) => (
          <button
            key={energy}
            onClick={() => setFilterEnergy(energy)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterEnergy === energy
                ? 'bg-[#00684A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#001E2B] bg-[#F0F5F2] border border-[#D1E2D7]'
            }`}
          >
            {energy}
          </button>
        ))}
      </div>

      {/* Task Kanban Columns (To Do, In Progress, Completed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: To Do */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#D1E2D7]">
            <span className="text-xs font-bold text-[#001E2B] uppercase tracking-wider font-mono">
              To Do ({filteredTasks.filter(t => t.status === 'todo').length})
            </span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>

          <div className="space-y-3">
            {filteredTasks.filter(t => t.status === 'todo').map((task) => (
              <GlassCard
                key={task.id}
                hoverEffect={false}
                className="p-4 bg-white border-[#D1E2D7] space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    task.energyNeeded === 'High Focus' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    'bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]'
                  }`}>
                    {task.energyNeeded}
                  </span>

                  <button onClick={() => toggleTaskStatus(task.id)} className="text-slate-400 hover:text-[#00684A]">
                    <Circle className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xs font-bold text-[#001E2B]">{task.title}</h3>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{task.description}</p>

                {task.aiScheduleRecommendation && (
                  <div className="p-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-[10px] text-[#00684A] flex items-center gap-1.5 font-mono font-semibold">
                    <Clock className="w-3 h-3 text-[#00684A] shrink-0" />
                    <span>{task.aiScheduleRecommendation}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-medium pt-2 border-t border-[#D1E2D7]">
                  <span>Priority: {task.priorityScore}/100</span>
                  <span>{task.dueDate}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#00684A]">
            <span className="text-xs font-bold text-[#00684A] uppercase tracking-wider font-mono">
              In Progress ({filteredTasks.filter(t => t.status === 'in_progress').length})
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00ED64] animate-pulse" />
          </div>

          <div className="space-y-3">
            {filteredTasks.filter(t => t.status === 'in_progress').map((task) => (
              <GlassCard
                key={task.id}
                hoverEffect={false}
                className="p-4 bg-white border-[#00684A] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                    {task.energyNeeded}
                  </span>

                  <button onClick={() => toggleTaskStatus(task.id)} className="text-[#00684A] hover:text-[#023430]">
                    <Flame className="w-4 h-4 text-amber-700" />
                  </button>
                </div>

                <h3 className="text-xs font-bold text-[#001E2B]">{task.title}</h3>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{task.description}</p>

                {task.linkedDecisionTitle && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-mono font-semibold">
                    Linked Decision: {task.linkedDecisionTitle}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-[#D1E2D7]">
                  <span>Priority: {task.priorityScore}/100</span>
                  <span className="text-[#00684A] font-extrabold">Active Now</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#C9DFD2]">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
              Completed ({filteredTasks.filter(t => t.status === 'completed').length})
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00684A]" />
          </div>

          <div className="space-y-3">
            {filteredTasks.filter(t => t.status === 'completed').map((task) => (
              <GlassCard
                key={task.id}
                hoverEffect={false}
                className="p-4 bg-[#F0F5F2] border-[#D1E2D7] opacity-80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-slate-600 border border-[#D1E2D7]">
                    {task.energyNeeded}
                  </span>

                  <button onClick={() => toggleTaskStatus(task.id)} className="text-[#00684A]">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xs font-bold text-slate-600 line-through">{task.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">{task.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>

      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-[#D1E2D7] rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#00684A]" />
                <h2 className="text-base font-bold text-[#001E2B]">Create Cognitive Task</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-[#001E2B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Audit Zero-Knowledge Argon2id Parameters"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00684A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Cognitive Energy Level Needed</label>
                <select
                  value={newEnergy}
                  onChange={(e) => setNewEnergy(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] focus:outline-none focus:border-[#00684A]"
                >
                  <option value="High Focus">High Focus (Deep Work)</option>
                  <option value="Medium Flow">Medium Flow</option>
                  <option value="Low Energy / Quick">Low Energy / Quick Win</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Description & Requirements</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Task details..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00684A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D1E2D7]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs shadow-md"
                >
                  Create Task
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
