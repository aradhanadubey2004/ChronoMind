import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Building2, 
  ShieldCheck, 
  Key, 
  Sliders, 
  CreditCard, 
  Save, 
  Check, 
  Sparkles, 
  Lock, 
  Users, 
  Bell
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import aiService from '../../services/aiService';

export const SettingsScreen = ({ user, onUpdateUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || '');
  const [company, setCompany] = useState(user?.company || '');

  // Workspace & Retention state
  const [workspaceName, setWorkspaceName] = useState('Apex AI Ventures');
  const [autoIndexMeetings, setAutoIndexMeetings] = useState(
    user?.settings?.autoIndexMeetings !== undefined ? user.settings.autoIndexMeetings : true
  );
  const [recordingRetentionDays, setRecordingRetentionDays] = useState(
    user?.settings?.recordingRetentionDays !== undefined
      ? user.settings.recordingRetentionDays
      : user?.settings?.retentionDays !== undefined
      ? user.settings.retentionDays
      : 30
  );
  const [sensitivityLevel, setSensitivityLevel] = useState(user?.settings?.sensitivityLevel || 'Strict');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const freshUser = await aiService.fetchUserProfile();
        if (freshUser) {
          if (freshUser.name) setName(freshUser.name);
          if (freshUser.email) setEmail(freshUser.email);
          if (freshUser.company) setCompany(freshUser.company);
          if (freshUser.settings) {
            if (freshUser.settings.autoIndexMeetings !== undefined) {
              setAutoIndexMeetings(freshUser.settings.autoIndexMeetings);
            }
            if (freshUser.settings.recordingRetentionDays !== undefined) {
              setRecordingRetentionDays(freshUser.settings.recordingRetentionDays);
            } else if (freshUser.settings.retentionDays !== undefined) {
              setRecordingRetentionDays(freshUser.settings.retentionDays);
            }
            if (freshUser.settings.sensitivityLevel) {
              setSensitivityLevel(freshUser.settings.sensitivityLevel);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch profile in SettingsScreen:', err.message);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = await aiService.updateUserSettings({
        name,
        company,
        settings: {
          autoIndexMeetings,
          recordingRetentionDays,
          retentionDays: recordingRetentionDays,
          sensitivityLevel,
        },
      });

      if (onUpdateUser && updatedUser) {
        onUpdateUser(updatedUser);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          name,
          company,
          settings: {
            autoIndexMeetings,
            recordingRetentionDays,
            retentionDays: recordingRetentionDays,
            sensitivityLevel,
          },
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1E2D7] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-[#00684A] bg-[#E8F3EC] border border-[#C9DFD2]">
              Enterprise Admin
            </span>
            <span className="text-xs font-mono text-slate-500">ID: usr_89421_chrono</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001E2B] tracking-tight">
            Account & Workspace Settings
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Manage your personal profile, zero-knowledge encryption keys, and AI memory indexing policy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8F3EC] text-[#00684A] text-xs font-bold border border-[#C9DFD2] animate-fade-in">
              <Check className="w-4 h-4" />
              Settings Saved
            </div>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex overflow-x-auto gap-2 border-b border-[#D1E2D7] pb-2 no-scrollbar">
        {[
          { id: 'profile', label: 'Personal Profile', icon: UserIcon },
          { id: 'workspace', label: 'Workspace & Team', icon: Building2 },
          { id: 'security', label: 'Zero-Knowledge Security', icon: Lock },
          { id: 'ai_rules', label: 'AI Memory Policy', icon: Sliders },
          { id: 'billing', label: 'Subscription & Billing', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#00684A] text-white shadow-xs'
                  : 'bg-white border border-[#D1E2D7] text-slate-600 hover:text-[#001E2B] hover:bg-[#F0F5F2]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6 bg-white border-[#D1E2D7]">
              <h3 className="text-base font-bold text-[#001E2B] mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#00684A]" />
                Profile Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-[#D1E2D7]">
                  <div className="w-16 h-16 rounded-2xl bg-[#00684A] text-white flex items-center justify-center font-extrabold text-xl shadow-xs">
                    {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" /> : (user?.name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <button className="px-3 py-1.5 rounded-lg bg-[#F0F5F2] hover:bg-[#E8F3EC] text-slate-700 text-xs font-bold transition-colors border border-[#D1E2D7]">
                      Change Photo
                    </button>
                    <p className="text-[11px] text-slate-500 mt-1">JPG or PNG, max 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#001E2B] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-[#001E2B] text-xs font-medium focus:outline-none focus:border-[#00684A] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#001E2B] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-[#001E2B] text-xs font-medium focus:outline-none focus:border-[#00684A] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#001E2B] mb-1">Role Title</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-[#001E2B] text-xs font-medium focus:outline-none focus:border-[#00684A] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#001E2B] mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-[#001E2B] text-xs font-medium focus:outline-none focus:border-[#00684A] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 bg-white border-[#D1E2D7]">
              <h3 className="text-base font-bold text-[#001E2B] mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#00684A]" />
                Notification Preferences
              </h3>
              <div className="space-y-3">
                {[
                  { title: 'Decision Timeline Alerts', desc: 'Notify when high-impact decisions change branch status' },
                  { title: 'Daily Cognitive Digest', desc: 'Receive morning email with summarized action items' },
                  { title: 'AI Conflict Warnings', desc: 'Instant alert if new conversation contradicts past decisions' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-[#D1E2D7] last:border-0">
                    <div>
                      <p className="text-xs font-bold text-[#001E2B]">{item.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#00684A] accent-[#00684A]" />
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[#D1E2D7]">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('chronomind_token');
                    localStorage.removeItem('jwt');
                    if (onNavigate) onNavigate('auth');
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all"
                >
                  Sign Out of Session
                </button>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6 bg-[#E8F3EC] border-[#C9DFD2]">
              <div className="flex items-center gap-2 text-[#00684A] font-bold text-xs uppercase font-mono mb-2">
                <Sparkles className="w-4 h-4 text-[#00684A]" />
                Cognitive Plan
              </div>
              <h4 className="text-xl font-extrabold text-[#001E2B] mb-1">Enterprise Pro</h4>
              <p className="text-xs text-slate-600 mb-4 font-medium">
                Unlimited memory indexing, multi-branch decision simulation, and custom vector storage.
              </p>
              <div className="p-3 rounded-xl bg-white border border-[#D1E2D7] text-xs font-semibold text-slate-700 space-y-1.5 mb-4">
                <div className="flex justify-between"><span>Indexed Memories:</span> <span className="font-bold text-[#00684A]">1,842 / ∞</span></div>
                <div className="flex justify-between"><span>Vector Storage:</span> <span className="font-bold text-[#00684A]">12.4 GB / 100 GB</span></div>
                <div className="flex justify-between"><span>Team Seats:</span> <span className="font-bold text-[#00684A]">8 / 15</span></div>
              </div>
              <button 
                onClick={() => setActiveTab('billing')}
                className="w-full py-2.5 rounded-xl bg-[#00684A] hover:bg-[#023430] text-white font-bold text-xs transition-colors shadow-xs"
              >
                Manage Billing
              </button>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'workspace' && (
        <div className="space-y-6">
          <GlassCard className="p-6 bg-white border-[#D1E2D7]">
            <h3 className="text-base font-bold text-[#001E2B] mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#00684A]" />
              Organization Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-[#001E2B] text-xs font-medium focus:outline-none focus:border-[#00684A] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">Workspace ID</label>
                <input
                  type="text"
                  value="ws_apex_ventures_9918"
                  disabled
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-mono font-medium"
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-white border-[#D1E2D7]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#001E2B] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00684A]" />
                Team Members & Access Control
              </h3>
              <button className="px-3 py-1.5 rounded-xl bg-[#00684A] text-white text-xs font-bold hover:bg-[#023430] transition-colors">
                + Invite Member
              </button>
            </div>

            <div className="divide-y divide-[#D1E2D7]">
              {[
                { name: 'Alex Rivera', email: 'alex@apexventures.ai', role: 'Owner', status: 'Active' },
                { name: 'Sarah Chen', email: 'sarah.c@apexventures.ai', role: 'Admin', status: 'Active' },
                { name: 'David Miller', email: 'd.miller@apexventures.ai', role: 'Member', status: 'Active' },
                { name: 'Elena Rostova', email: 'elena@apexventures.ai', role: 'Member', status: 'Pending' },
              ].map((member, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] flex items-center justify-center font-bold text-xs text-[#00684A]">
                      {member.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#001E2B]">{member.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 px-2 py-1 rounded-md bg-[#F0F5F2]">
                      {member.role}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      member.status === 'Active' ? 'bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <GlassCard className="p-6 border-[#C9DFD2] bg-[#E8F3EC]">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#00684A] text-white shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#001E2B]">Zero-Knowledge Hardware Envelope</h3>
                <p className="text-xs text-slate-700 font-medium mt-1 max-w-2xl">
                  ChronoMind AI uses AES-256 client-side memory envelope keys. Neither ChronoMind employees nor cloud infrastructure operators can decrypt your transcript memory nodes.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-white text-[#00684A] border border-[#C9DFD2] text-[11px] font-extrabold font-mono">
                    STATUS: ENCRYPTED
                  </span>
                  <span className="text-xs text-[#00684A] font-mono font-bold">Key Hash: 0x8F92...B31C</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-white border-[#D1E2D7]">
            <h3 className="text-base font-bold text-[#001E2B] mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#00684A]" />
              API Key & Integration Credentials
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#001E2B]">Gemini 2.5 Flash API Bridge</p>
                  <p className="text-[11px] font-mono text-slate-500 font-medium">cm_live_sk_9042...881a</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-white border border-[#D1E2D7] text-xs font-bold text-[#001E2B] hover:bg-[#E8F3EC]">
                  Regenerate Key
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#001E2B]">Zoom / Teams Audio Ingestion Webhook</p>
                  <p className="text-[11px] font-mono text-slate-500 font-medium">https://api.chronomind.ai/v1/ingest/hook_7719</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-white border border-[#D1E2D7] text-xs font-bold text-[#001E2B] hover:bg-[#E8F3EC]">
                  Copy Webhook
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'ai_rules' && (
        <div className="space-y-6">
          <GlassCard className="p-6 bg-white border-[#D1E2D7]">
            <h3 className="text-base font-bold text-[#001E2B] mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#00684A]" />
              Memory Retention & Extraction Rules
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7]">
                <div>
                  <p className="text-xs font-bold text-[#001E2B]">Automatic Meeting Ingestion</p>
                  <p className="text-[11px] text-slate-500 font-medium">Automatically transcribe and vectorize calendar meetings</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoIndexMeetings}
                  onChange={(e) => setAutoIndexMeetings(e.target.checked)}
                  className="w-5 h-5 rounded text-[#00684A] accent-[#00684A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#001E2B]">
                    Recording & Audio Retention Policy
                  </label>
                  <span className="text-[10px] font-bold text-[#00684A] bg-[#E8F3EC] px-2 py-0.5 rounded-full border border-[#C9DFD2]">
                    Default: 30 Days
                  </span>
                </div>
                <select
                  value={recordingRetentionDays}
                  onChange={(e) => setRecordingRetentionDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-[#001E2B] text-xs font-bold"
                >
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days (Recommended / Default)</option>
                  <option value={90}>90 Days</option>
                  <option value={0}>Never (Keep Audio Indefinitely)</option>
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed font-medium">
                  Raw audio files are automatically cleaned up after the selected retention period. Transcripts, extracted structured memories, tasks, and decisions remain permanently preserved in RAG storage.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">
                  Decision Conflict Sensitivity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Standard', label: 'Standard', desc: 'Alert on direct contradictions' },
                    { id: 'Strict', label: 'Strict (Recommended)', desc: 'Alert on subtle roadmap drift' },
                    { id: 'AirGapped', label: 'Paranoid', desc: 'Require manual review for all items' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setSensitivityLevel(lvl.id)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        sensitivityLevel === lvl.id
                          ? 'bg-[#E8F3EC] border-[#00684A] text-[#00684A] font-bold shadow-2xs'
                          : 'bg-white border-[#D1E2D7] text-slate-600 hover:bg-[#F0F5F2]'
                      }`}
                    >
                      <p className="text-xs font-bold">{lvl.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <GlassCard className="p-6 bg-white border-[#D1E2D7]">
            <h3 className="text-base font-bold text-[#001E2B] mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#00684A]" />
              Active Plan & Payment Method
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl bg-[#F0F5F2] border border-[#D1E2D7]">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Current Plan</p>
                <p className="text-xl font-extrabold text-[#001E2B] mt-1">$149 / month</p>
                <p className="text-xs font-bold text-[#00684A] mt-0.5">Enterprise Pro (Billed Annually)</p>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Renews automatically on Oct 14, 2026</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F0F5F2] border border-[#D1E2D7] flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Payment Method</p>
                  <p className="text-xs font-bold text-[#001E2B] mt-2 flex items-center gap-2">
                    •••• •••• •••• 4242
                    <span className="px-2 py-0.5 rounded text-[10px] bg-white border border-[#D1E2D7] font-mono">VISA</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">Expires 08/28</p>
                </div>
                <button className="text-xs font-bold text-[#00684A] hover:underline self-start mt-2">
                  Update Card
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
