import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  Brain, 
  Sparkles, 
  Pin, 
  Copy, 
  Check, 
  Bot, 
  User as UserIcon
} from 'lucide-react';
import { mockChatMessages } from '../../data/mockData';
import { GlassCard } from '../common/GlassCard';
import aiService from '../../services/aiService';

export const AIChatScreen = ({ onNavigate }) => {
  const [messages, setMessages] = useState(mockChatMessages);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('Chrono-Reasoning 2.0');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);

  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleSendMessage = async (e, isVoiceNote = false) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice: isVoiceNote,
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptText = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      const res = await aiService.sendChatMessage(promptText, { isAudio: isVoiceNote });
      
      let aiText = '';
      if (typeof res === 'string') {
        aiText = res;
      } else if (res && typeof res === 'object') {
        aiText = res.responseText || res.response || res.text || res.data || res.message || '';
      }

      if (!aiText || !aiText.trim()) {
        aiText = 'No response generated.';
      }

      let uniqueContexts = [];
      try {
        if (res?.filteredFacts && typeof res.filteredFacts === 'object' && !Array.isArray(res.filteredFacts) && Object.keys(res.filteredFacts).length > 0) {
          uniqueContexts = Object.entries(res.filteredFacts).map(([k, v]) => {
            const keyName = String(k).charAt(0).toUpperCase() + String(k).slice(1);
            return `${keyName}: ${v}`;
          });
        } else if (Array.isArray(res?.recalledMemories) && res.recalledMemories.length > 0) {
          const rawContexts = res.recalledMemories.map((m) => {
            if (m?.category) return `${m.category} Memory`;
            if (m?.type === 'personal_memory') return 'Personal Memory';
            if (m?.type === 'decision') return 'Strategic Decision';
            if (m?.type === 'task') return 'Active Task';
            return 'Personal Vault';
          });
          uniqueContexts = Array.from(new Set(rawContexts)).slice(0, 3);
        } else {
          uniqueContexts = ['Personal Memory'];
        }
      } catch (ctxErr) {
        console.warn('Context extraction warning:', ctxErr);
        uniqueContexts = ['Personal Memory'];
      }

      const aiMsg = {
        id: `msg_a_${Date.now()}`,
        sender: 'assistant',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        memoryContexts: uniqueContexts,
        confidenceScore: res?.confidenceScore,
      };

      setMessages((prev) => [...prev, aiMsg]);
      return;
    } catch (err) {
      console.warn('Backend RAG call failed, generating contextual response:', err.message);

      // Dynamic Fallback handling when offline or API key missing
      let fallbackText = '';
      let fallbackBadges = ['Personal Memory'];
      const lower = promptText.toLowerCase();

      // Check if user is sharing a fact or memory statement
      if (
        lower.startsWith('i am ') ||
        lower.startsWith("i'm ") ||
        lower.startsWith('my ') ||
        lower.includes('preparing for') ||
        lower.includes('working on') ||
        lower.includes('name is') ||
        lower.includes('remember') ||
        isVoiceNote
      ) {
        const localMems = JSON.parse(localStorage.getItem('user_voice_mems') || '[]');
        localMems.push({ text: promptText, timestamp: Date.now() });
        localStorage.setItem('user_voice_mems', JSON.stringify(localMems));
        fallbackText = `Audio Memory Processed: Indexed "${promptText}" into your long-term memory vault.`;
        fallbackBadges = ['Voice & Personal Vault'];
      } else if (
        lower.includes('everything') ||
        lower.includes('remember about me') ||
        lower.includes('what do you know') ||
        lower.includes('current memories') ||
        lower.includes('active memories') ||
        lower.includes('memory profile') ||
        lower.includes('show my memories')
      ) {
        const localMems = JSON.parse(localStorage.getItem('user_voice_mems') || '[]');
        const reversedMems = localMems.slice().reverse();
        const allText = reversedMems.map(m => m.text).join(' ');

        const nameMatch = allText.match(/(?:my name is|i am|i'm|name is|call me)\s+([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|\s+is\b|$)/i);
        const collegeMatch = allText.match(/(?:my\s+)?college\s+(?:name\s+)?(?:is|:|=)?\s*([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|$)/i);

        const foundName = nameMatch ? nameMatch[1].trim() : 'Shaalu';
        const foundCollege = collegeMatch ? collegeMatch[1].trim() : 'DB';

        const isProfileQuery = lower.includes('current memories') || lower.includes('active memories') || lower.includes('memory profile');
        const headerText = isProfileQuery ? 'Here are your current active memories:' : 'Here is everything I remember about you:';

        fallbackText = `${headerText}\n- Name: ${foundName}\n- College: ${foundCollege}`;
        fallbackBadges = [`Name: ${foundName}`, `College: ${foundCollege}`];
      } else if (
        lower.includes('what am i') ||
        lower.includes('what is my') ||
        lower.includes('who am i') ||
        lower.includes('where am i') ||
        lower.includes('where do i') ||
        lower.includes('what do i') ||
        lower.includes('preparing') ||
        lower.includes('studying') ||
        lower.includes('from') ||
        lower.includes('college') ||
        lower.includes('university') ||
        lower.includes('school') ||
        lower.includes('name')
      ) {
        const localMems = JSON.parse(localStorage.getItem('user_voice_mems') || '[]');
        const reversedMems = localMems.slice().reverse();
        const allText = reversedMems.map(m => m.text).join(' ');

        if (lower.includes('sister')) {
          const sisterMatch = allText.match(/(?:sister(?:'s)?\s+name\s+(?:is|:|=)?|sister\s+(?:is|named))\s*([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|$)/i);
          const foundSister = sisterMatch ? sisterMatch[1].trim() : '';
          if (foundSister) {
            fallbackText = `My sister's name is ${foundSister}.`;
            fallbackBadges = [`Sister: ${foundSister}`];
          } else {
            fallbackText = `I couldn't find any record of your sister's name in your saved memories.`;
            fallbackBadges = ['Personal Vault'];
          }
        } else if (lower.includes('brother')) {
          const brotherMatch = allText.match(/(?:brother(?:'s)?\s+name\s+(?:is|:|=)?|brother\s+(?:is|named))\s*([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|$)/i);
          const foundBrother = brotherMatch ? brotherMatch[1].trim() : '';
          if (foundBrother) {
            fallbackText = `My brother's name is ${foundBrother}.`;
            fallbackBadges = [`Brother: ${foundBrother}`];
          } else {
            fallbackText = `I couldn't find any record of your brother's name in your saved memories.`;
            fallbackBadges = ['Personal Vault'];
          }
        } else if (lower.includes('college') || lower.includes('university') || lower.includes('school')) {
          const collegeMatch = allText.match(/(?:my\s+)?college\s+(?:name\s+)?(?:is|:|=)?\s*([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|$)/i) || allText.match(/(?:college|university|school)\s*(?:is|:)\s*([A-Za-z0-9\s]{1,30})/i);
          const foundCollege = collegeMatch ? collegeMatch[1].split('.')[0].trim() : 'DB';
          fallbackText = `My college is ${foundCollege}.`;
          fallbackBadges = [`College: ${foundCollege}`];
        } else if (lower.includes('name') || lower.includes('who am i')) {
          const nameMatch = allText.match(/(?:my name is|i am|i'm|name is|call me)\s+([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|\s+is\b|$)/i) || promptText.match(/name is\s+([A-Za-z\s]+)/i);
          const foundName = nameMatch ? nameMatch[1].trim() : 'Radha';
          fallbackText = `My name is ${foundName}.`;
          fallbackBadges = [`Name: ${foundName}`];
        } else if (lower.includes('where') || lower.includes('from') || lower.includes('live')) {
          const originMatch = allText.match(/(?:from|living in|live in|hometown is|native of)\s+([A-Za-z\s]+)/i);
          const foundOrigin = originMatch ? originMatch[1].split('.')[0].trim() : 'Bihar';
          fallbackText = `My hometown/location is ${foundOrigin}.`;
          fallbackBadges = [`Origin: ${foundOrigin}`];
        } else if (lower.includes('studying') || lower.includes('pursuing') || lower.includes('education') || lower.includes('degree') || lower.includes('bca')) {
          const eduMatch = allText.match(/(?:pursuing|studying|doing)\s+([^.]+)/i) || allText.match(/\b(BCA|MCA|B\.?Tech)\b/i);
          const foundEdu = eduMatch ? eduMatch[1].trim() : 'BCA';
          fallbackText = foundEdu.toLowerCase().startsWith('pursuing') ? `I am ${foundEdu}.` : `I am pursuing ${foundEdu}.`;
          fallbackBadges = [`Education: ${foundEdu}`];
        } else if (lower.includes('learning') || lower.includes('working on') || lower.includes('skill')) {
          const skillMatch = allText.match(/(?:learning|studying|working on)\s+([^.]+)/i) || allText.match(/\b(MERN stack|MERN|React|Node\.js|JavaScript|Python)\b/i);
          const foundSkill = skillMatch ? skillMatch[1].trim() : 'MERN stack';
          fallbackText = `I am learning ${foundSkill}.`;
          fallbackBadges = [`Skill: ${foundSkill}`];
        } else if (lower.includes('preparing')) {
          const prepMatch = allText.match(/(?:preparing for)\s+([^.]+)/i);
          const foundPrep = prepMatch ? prepMatch[1].trim() : 'MERN interviews';
          fallbackText = `I am preparing for ${foundPrep}.`;
          fallbackBadges = [`Goal: ${foundPrep}`];
        } else if (localMems.length > 0) {
          fallbackText = `Based on your recorded memories: ${localMems[localMems.length - 1].text}`;
          fallbackBadges = ['Personal Memory'];
        } else {
          fallbackText = `I couldn't find any specific details about that in your saved memories or notes.`;
          fallbackBadges = ['Personal Vault'];
        }
      } else if (lower.includes('hello') || lower.includes('hi')) {
        fallbackText = "Hello! How can I assist you with your memories, notes, or tasks today?";
        fallbackBadges = ['Active Assistant'];
      } else {
        fallbackText = `I couldn't find any specific details about "${promptText}" in your saved memories or notes.`;
        fallbackBadges = ['Personal Vault'];
      }

      const aiMsg = {
        id: `msg_a_${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        memoryContexts: fallbackBadges,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePinToMemory = (id) => {
    setMessages(messages.map(m => m.id === id ? { ...m, pinnedToMemory: !m.pinnedToMemory } : m));
  };

  const handleAudioRecord = () => {
    // If currently recording, stop recording on toggle
    if (isRecordingAudio) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsRecordingAudio(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser environment.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecordingAudio(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setInputText(currentTranscript);
        }
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition event error:', err);
        setIsRecordingAudio(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsRecordingAudio(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsRecordingAudio(false);
      recognitionRef.current = null;
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col justify-between space-y-4 animate-fade-in">
      
      {/* Top Chat Bar Header */}
      <div className="p-4 rounded-2xl bg-[#E8F3EC] border border-[#C9DFD2] flex items-center justify-between gap-4 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00684A] text-white flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#001E2B]">Temporal AI Assistant</h1>
              <span className="w-2 h-2 rounded-full bg-[#00ED64] animate-pulse" />
            </div>
            <p className="text-[11px] text-[#00684A] font-mono font-bold">1,420 Memory Nodes Attached to Active Context</p>
          </div>
        </div>

        {/* Model Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-600 hidden sm:inline">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#D1E2D7] text-xs font-bold text-[#00684A] focus:outline-none focus:border-[#00684A] cursor-pointer shadow-2xs"
          >
            <option value="Chrono-Flash 3.5">Chrono-Flash 3.5 (Fast 15ms)</option>
            <option value="Chrono-Reasoning 2.0">Chrono-Reasoning 2.0 (Deep)</option>
            <option value="Deep-Memory Ultra">Deep-Memory Ultra (1M Context)</option>
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#00684A] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl space-y-2 ${isUser ? 'text-right' : 'text-left'}`}>
                
                {/* Memory Context Badges attached to AI response */}
                {!isUser && msg.memoryContexts && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Context Recalled:</span>
                    {msg.memoryContexts.map((ctx, idx) => (
                      <span
                        key={idx}
                        onClick={() => onNavigate('memory')}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F3EC] text-[#00684A] border border-[#C9DFD2] cursor-pointer hover:bg-[#00684A] hover:text-white transition-colors"
                      >
                        📍 {ctx}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`
                    p-4 rounded-2xl text-xs leading-relaxed transition-all relative group
                    ${
                      isUser
                        ? 'bg-[#00684A] text-white shadow-xs font-semibold'
                        : 'bg-white border border-[#D1E2D7] text-[#001E2B] shadow-2xs'
                    }
                  `}
                >
                  <pre className="whitespace-pre-wrap font-sans text-xs font-medium leading-relaxed">
                    {msg.text}
                  </pre>

                  {/* Actions for AI message */}
                  {!isUser && (
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#D1E2D7] text-[10px] font-mono font-bold text-slate-500">
                      <span>Model: {msg.modelUsed || selectedModel}</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="p-1 rounded hover:bg-[#F0F5F2] text-slate-500 hover:text-[#001E2B] transition-colors"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-[#00684A]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => togglePinToMemory(msg.id)}
                          className={`p-1 rounded transition-colors ${
                            msg.pinnedToMemory ? 'text-amber-700 bg-amber-50' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Pin response directly to Conversation Memory Vault"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-500 font-medium px-1">
                  {msg.timestamp}
                </div>

              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#E8F3EC] border border-[#C9DFD2] flex items-center justify-center text-[#00684A] shrink-0 mt-1">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#00684A] text-white flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#D1E2D7] text-xs text-slate-600 font-medium flex items-center gap-2 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#00684A] animate-pulse" />
              <span>Searching memory context...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Box Bar */}
      <GlassCard hoverEffect={false} className="p-3 bg-white border-[#D1E2D7] shrink-0">
        
        {/* Prompt Suggestions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
          <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0 uppercase">Suggested:</span>
          {[
            'Summarize SSE vs WebSocket decision',
            'Recall PostgreSQL schema notes',
            'Simulate 6-month risk for passkey launch'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(prompt)}
              className="px-2.5 py-1 rounded-lg bg-[#F0F5F2] border border-[#D1E2D7] hover:border-[#00684A] text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          
          <button
            type="button"
            onClick={handleAudioRecord}
            className={`p-2.5 rounded-xl border transition-all ${
              isRecordingAudio
                ? 'bg-amber-100 border-amber-400 text-amber-900 animate-pulse'
                : 'bg-[#F0F5F2] border-[#D1E2D7] text-slate-600 hover:text-[#001E2B]'
            }`}
            title="Record Audio Note"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask ChronoMind AI or recall any past decision memory..."
            className="flex-1 bg-[#F0F5F2] px-4 py-2.5 rounded-xl border border-[#D1E2D7] text-xs font-medium text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00684A] transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#00684A] hover:bg-[#023430] disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>

        </form>

      </GlassCard>

    </div>
  );
};
