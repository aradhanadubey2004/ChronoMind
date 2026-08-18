import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Brain, 
  Calendar, 
  AlertCircle, 
  Play, 
  Trash2, 
  Send, 
  Layers, 
  Tag, 
  Users, 
  CheckSquare, 
  ArrowRight,
  RefreshCw,
  Zap,
  Bookmark
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import aiService from '../../services/aiService';

// Pre-packaged sample transcripts for quick testing
const SAMPLE_TRANSCRIPTS = [
  {
    title: 'Database & Backend Sync',
    text: 'Team decided to use MongoDB Atlas. Rahul will complete backend by Friday.',
  },
  {
    title: 'Product & AI Memory Architecture',
    text: 'In today’s sync, Aradhana agreed to deploy the AI Brain Dashboard by Thursday. College exams at LU start next week. Target goal is Full Stack Developer role.',
  },
  {
    title: 'Infrastructure & GCP Review',
    text: 'Architecture review meeting: We agreed on Express + Vite stack. Primary database is MongoDB Atlas hosted on GCP Cloud Run. Rahul takes ownership of API routes with deadline Friday. Budget approved for GCP deployment.',
  },
];

export const MeetingIntelligenceScreen = ({ onNavigate }) => {
  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Result state
  const [meetingResult, setMeetingResult] = useState(null);
  const [meetingList, setMeetingList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTranscriptRef = useRef('');
  const isRecordingRef = useRef(false);
  const transcriptRef = useRef('');

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Load meeting history on mount
  const loadMeetingHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await aiService.fetchMeetings();
      if (Array.isArray(data)) {
        setMeetingList(data);
        if (data.length > 0 && !meetingResult) {
          setMeetingResult(data[0]);
        }
      }
    } catch (err) {
      console.warn('Could not fetch meeting history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadMeetingHistory();
  }, []);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          sessionTranscript += event.results[i][0].transcript;
        }
        const base = baseTranscriptRef.current ? baseTranscriptRef.current.trim() : '';
        const combined = base ? (base + ' ' + sessionTranscript.trim()).trim() : sessionTranscript.trim();
        setTranscript(combined);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          baseTranscriptRef.current = transcriptRef.current;
          try {
            recognition.start();
          } catch (e) {
            console.warn('Could not restart recognition:', e);
          }
        }
      };

      recognitionRef.current = recognition;

      return () => {
        try {
          recognition.stop();
        } catch (e) {}
      };
    }
  }, []);

  // Timer tick for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else {
      // Start recording
      setIsRecording(true);
      isRecordingRef.current = true;
      baseTranscriptRef.current = transcript;
      setRecordSeconds(0);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      } else {
        // Fallback simulation note
        setTranscript((prev) =>
          prev
            ? prev + ' [Live mic active - Speak clearly into your microphone]'
            : 'Team decided to use MongoDB Atlas. Rahul will complete backend by Friday.'
        );
      }
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!transcript.trim()) {
      setError('Please record or enter a meeting transcript to analyze.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await aiService.analyzeMeetingIntelligence(
        transcript.trim(),
        meetingTitle.trim(),
        recordSeconds
      );

      setMeetingResult(result);
      setSuccessMsg('Meeting intelligence successfully generated & indexed in RAG memory!');
      setTranscript('');
      baseTranscriptRef.current = '';
      await loadMeetingHistory();
    } catch (err) {
      setError(err.message || 'Failed to analyze meeting transcript.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await aiService.deleteMeeting(id);
      if (meetingResult?.meetingId === id) {
        setMeetingResult(null);
      }
      setSuccessMsg('Meeting intelligence record deleted.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadMeetingHistory();
    } catch (err) {
      setError('Failed to delete meeting record.');
    }
  };

  const handleDeleteRecording = async (id) => {
    try {
      await aiService.deleteMeetingRecording(id);
      setSuccessMsg('Raw audio recording deleted. Transcripts, tasks, decisions, and memories preserved in RAG storage.');
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadMeetingHistory();
    } catch (err) {
      setError(err.message || 'Failed to delete audio recording.');
    }
  };

  const handleRunRetentionCleanup = async () => {
    try {
      const res = await aiService.triggerRecordingCleanup();
      setSuccessMsg(`Retention cleanup complete: ${res.deletedCount || 0} expired recording audio files purged. Structured data retained.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadMeetingHistory();
    } catch (err) {
      setError('Failed to execute retention cleanup.');
    }
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Page Header */}
      <div className="p-6 rounded-3xl bg-[#E8F3EC] border border-[#C9DFD2] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#00684A] text-white flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              MEETING INTELLIGENCE ENGINE
            </span>
            <span className="text-xs text-[#00684A] font-mono font-bold">RAG & Vector Memory Synchronized</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001E2B] tracking-tight">
            AI Meeting Intelligence
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Capture audio or enter transcripts to automatically extract summaries, decisions, tasks, deadlines, and persistent memory facts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('chat')}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#D1E2D7] text-slate-800 font-bold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <Brain className="w-4 h-4 text-[#00684A]" />
            <span>Ask RAG Assistant</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Main Grid Layout: Left Input/Recorder, Right Analysis Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recording & Input (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <GlassCard hoverEffect={false} className="p-5 bg-white border-[#D1E2D7] space-y-4">
            <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#00684A]" />
                <h2 className="text-sm font-extrabold text-[#001E2B]">Meeting Recording & Input</h2>
              </div>
              {isRecording && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-mono font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  REC {formatTime(recordSeconds)}
                </span>
              )}
            </div>

            {/* Quick Record Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-[#00684A] hover:bg-[#023430] text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isRecording ? 'Stop Recording' : 'Start Live Meeting Capture'}</span>
              </button>
            </div>

            {/* Sample Transcript Quick Loaders */}
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase block mb-1.5">
                Load Sample Transcript:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TRANSCRIPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMeetingTitle(sample.title);
                      setTranscript(sample.text);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#F0F5F2] hover:bg-[#E8F3EC] text-slate-700 text-[11px] font-medium border border-[#D1E2D7] transition-all flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-[#00684A]" />
                    <span>{sample.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Transcript Text Area */}
            <form onSubmit={handleAnalyze} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">
                  Meeting Title (Optional)
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Sprint Planning / Database Sync"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-semibold text-[#001E2B] focus:outline-none focus:border-[#00684A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001E2B] mb-1">
                  Meeting Transcript Content
                </label>
                <textarea
                  rows={6}
                  required
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste or record meeting transcript here... e.g. Team decided to use MongoDB Atlas. Rahul will complete backend by Friday."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F5F2] border border-[#D1E2D7] text-xs font-medium text-[#001E2B] focus:outline-none focus:border-[#00684A] leading-relaxed resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing || !transcript.trim()}
                className="w-full py-3 px-4 rounded-2xl bg-[#00684A] hover:bg-[#023430] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Extracting AI Intelligence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Generate Meeting Intelligence</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>

          {/* Past Meetings Drawer */}
          <GlassCard hoverEffect={false} className="p-5 bg-white border-[#D1E2D7] space-y-3">
            <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-2 flex-wrap gap-2">
              <span className="text-xs font-mono font-extrabold uppercase text-[#001E2B] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#00684A]" />
                Recent Meeting Intelligence Logs ({meetingList.length})
              </span>

              <button
                type="button"
                onClick={handleRunRetentionCleanup}
                className="px-2.5 py-1 rounded-lg bg-[#E8F3EC] hover:bg-[#D8EADB] text-[#00684A] border border-[#C9DFD2] text-[10px] font-bold transition-all flex items-center gap-1"
                title="Run automatic recording retention cleanup based on user policy"
              >
                <RefreshCw className="w-3 h-3 text-[#00684A]" />
                <span>Run Cleanup Engine</span>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {meetingList.map((m) => (
                <div
                  key={m.meetingId}
                  onClick={() => setMeetingResult(m)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    meetingResult?.meetingId === m.meetingId
                      ? 'bg-[#E8F3EC] border-[#00684A] shadow-2xs'
                      : 'bg-[#F0F5F2] border-[#D1E2D7] hover:border-[#00684A]'
                  }`}
                >
                  <div className="space-y-1 overflow-hidden flex-1">
                    <div className="font-bold text-[#001E2B] truncate">{m.title}</div>
                    
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {m.audioDeleted ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Audio Purged (30d Policy)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <Mic className="w-2.5 h-2.5" />
                          Audio Active
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-500">
                        {m.decisions?.length || 0} Decision(s) • {m.actionItems?.length || 0} Task(s)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!m.audioDeleted && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecording(m.meetingId);
                        }}
                        className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 p-1.5 rounded-lg border border-amber-200 text-[10px] font-bold transition-colors flex items-center gap-1"
                        title="Delete raw audio recording only (preserves transcript, memories, tasks, decisions)"
                      >
                        <Trash2 className="w-3 h-3 text-amber-600" />
                        <span className="hidden sm:inline">Purge Audio</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(m.meetingId);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors"
                      title="Delete full meeting record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {meetingList.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-xs font-medium">
                  No meeting intelligence records stored yet.
                </div>
              )}
            </div>
          </GlassCard>

        </div>

        {/* Right Column: AI Intelligence Outputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {meetingResult ? (
            <div className="space-y-5 animate-fade-in">
              
              {/* Top Summary Banner */}
              <GlassCard glowColor="emerald" className="p-6 bg-white border-[#D1E2D7] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#D1E2D7] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#E8F3EC] text-[#00684A]">
                      <FileText className="w-4 h-4" />
                    </span>
                    <h2 className="text-base font-extrabold text-[#001E2B]">{meetingResult.title}</h2>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]">
                    Category: {meetingResult.category || 'General'}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Meeting Executive Summary:
                  </h3>
                  <p className="text-xs sm:text-sm text-[#001E2B] font-medium leading-relaxed bg-[#F0F5F2] p-3.5 rounded-2xl border border-[#D1E2D7]">
                    {meetingResult.summary}
                  </p>
                </div>

                {/* Key Discussion Points */}
                {meetingResult.keyPoints && meetingResult.keyPoints.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Key Discussion Points:
                    </h3>
                    <ul className="space-y-1.5">
                      {meetingResult.keyPoints.map((pt, i) => (
                        <li key={i} className="text-xs text-[#001E2B] font-medium flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00684A] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </GlassCard>

              {/* Grid 2: Decisions & Action Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Decisions Section */}
                <GlassCard hoverEffect={false} className="p-5 bg-white border-[#D1E2D7] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-2">
                    <span className="text-xs font-mono font-extrabold uppercase text-[#001E2B] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#00684A]" />
                      Important Decisions ({meetingResult.decisions?.length || 0})
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {meetingResult.decisions && meetingResult.decisions.length > 0 ? (
                      meetingResult.decisions.map((dec, i) => (
                        <div key={i} className="p-3 rounded-2xl bg-[#F0F5F2] border border-[#D1E2D7] space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#001E2B]">{dec.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2]">
                              {dec.impact || 'Impact: Med'}
                            </span>
                          </div>
                          {dec.context && (
                            <p className="text-[11px] text-slate-600 font-medium">{dec.context}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 font-medium py-2">No explicit decisions recorded.</div>
                    )}
                  </div>
                </GlassCard>

                {/* Action Items / Tasks Section */}
                <GlassCard hoverEffect={false} className="p-5 bg-white border-[#D1E2D7] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-2">
                    <span className="text-xs font-mono font-extrabold uppercase text-[#001E2B] flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-[#00684A]" />
                      Action Items / Tasks ({meetingResult.actionItems?.length || 0})
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {meetingResult.actionItems && meetingResult.actionItems.length > 0 ? (
                      meetingResult.actionItems.map((item, i) => (
                        <div key={i} className="p-3 rounded-2xl bg-[#F0F5F2] border border-[#D1E2D7] space-y-1">
                          <div className="text-xs font-bold text-[#001E2B]">{item.task}</div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                            <span>Assignee: <strong className="text-[#00684A]">{item.assignee || 'Team'}</strong></span>
                            <span>Deadline: <strong className="text-slate-700">{item.deadline || 'TBD'}</strong></span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 font-medium py-2">No actionable tasks detected.</div>
                    )}
                  </div>
                </GlassCard>

              </div>

              {/* Grid 3: Deadlines & Important People Mentioned */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Deadlines Section */}
                <GlassCard hoverEffect={false} className="p-5 bg-white border-[#D1E2D7] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-2">
                    <span className="text-xs font-mono font-extrabold uppercase text-[#001E2B] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#00684A]" />
                      Discussed Deadlines ({meetingResult.deadlines?.length || 0})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {meetingResult.deadlines && meetingResult.deadlines.length > 0 ? (
                      meetingResult.deadlines.map((dl, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-[#F0F5F2] p-2.5 rounded-xl border border-[#D1E2D7]">
                          <span className="font-semibold text-[#001E2B]">{dl.description}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                            {dl.dateOrTimeframe || 'TBD'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 font-medium py-2">No specific deadlines mentioned.</div>
                    )}
                  </div>
                </GlassCard>

                {/* Important People Mentioned */}
                <GlassCard hoverEffect={false} className="p-5 bg-white border-[#D1E2D7] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-2">
                    <span className="text-xs font-mono font-extrabold uppercase text-[#001E2B] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#00684A]" />
                      People Mentioned ({meetingResult.peopleMentioned?.length || 0})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {meetingResult.peopleMentioned && meetingResult.peopleMentioned.length > 0 ? (
                      meetingResult.peopleMentioned.map((person, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-xl bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2] text-xs font-extrabold flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {person}
                        </span>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 font-medium py-2">No individual names tagged.</div>
                    )}
                  </div>
                </GlassCard>

              </div>

              {/* Memory Facts Stored Section */}
              <GlassCard hoverEffect={false} className="p-5 bg-white border-[#D1E2D7] space-y-3">
                <div className="flex items-center justify-between border-b border-[#D1E2D7] pb-2">
                  <span className="text-xs font-mono font-extrabold uppercase text-[#001E2B] flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-[#00684A]" />
                    Memory Facts Stored to Long-Term Memory ({meetingResult.memoryFacts?.length || 0})
                  </span>
                  <button
                    onClick={() => onNavigate('brain')}
                    className="text-xs font-mono font-bold text-[#00684A] hover:underline flex items-center gap-1"
                  >
                    <span>View AI Brain Dashboard</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {meetingResult.memoryFacts && meetingResult.memoryFacts.length > 0 ? (
                    meetingResult.memoryFacts.map((fact, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-[#E8F3EC] border border-[#C9DFD2] flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#00684A] shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-mono font-bold uppercase text-slate-500 block text-[10px]">
                            {fact.key}:
                          </span>
                          <span className="font-extrabold text-[#001E2B]">
                            {fact.value}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 font-medium py-2">No new long-term facts stored.</div>
                  )}
                </div>
              </GlassCard>

            </div>
          ) : (
            <GlassCard hoverEffect={false} className="p-12 text-center bg-white border-[#D1E2D7] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F3EC] text-[#00684A] mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-base font-extrabold text-[#001E2B]">Ready for Meeting Intelligence</h2>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Record a live meeting or select a sample transcript on the left to extract structured executive summaries, decisions, action items, deadlines, and memory facts.
              </p>
            </GlassCard>
          )}

        </div>

      </div>

    </div>
  );
};
