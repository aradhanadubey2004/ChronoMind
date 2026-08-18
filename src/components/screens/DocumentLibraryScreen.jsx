import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Search,
  Trash2,
  MessageSquare,
  Sparkles,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  X,
  Send,
  BookOpen,
  Cpu,
  Layers,
  Zap,
  ArrowRight
} from 'lucide-react';
import {
  uploadDocument,
  fetchDocuments,
  deleteDocument,
  chatWithDocument
} from '../../services/aiService';

const SAMPLE_RESUME_TEXT = `Aradhana Dubey
Email: aradhanadubey2004@gmail.com | Portfolio: https://chronomind.ai
Full Stack AI Developer & Software Engineer

SUMMARY:
Highly driven Full Stack Software Engineer specializing in AI-driven web applications, Retrieval-Augmented Generation (RAG) architecture, and vector memory systems. Proficient in React, Node.js, Express, MongoDB Atlas Vector Search, and Gemini API integrations.

CORE SKILLS & TECHNOLOGIES:
- Frontend: React 19, JavaScript (ES6+), TypeScript, Vite, Tailwind CSS, Redux, Motion.
- Backend & APIs: Node.js, Express.js, RESTful APIs, WebSockets, JWT Authentication, Multer.
- Database & Vector Search: MongoDB Atlas, Mongoose, Vector Search, Cosine Similarity, Redis.
- AI & RAG Pipeline: Google GenAI (Gemini 2.5 Flash), Vector Embeddings (text-embedding-004), Semantic Chunking, Context Reranking.
- Tools & DevOps: Git, GitHub, Docker, Cloud Run, Postman, CI/CD pipelines.

WORK EXPERIENCE:
Senior AI Application Developer - ChronoMind AI (2024 - Present)
- Designed and engineered temporal memory RAG pipeline using MongoDB Atlas Vector Search and Gemini API.
- Implemented document intelligence memory supporting PDF, TXT, and Word document chunking and retrieval.
- Optimized vector similarity search latency by 40% with in-memory caching and batch embedding pipelines.

PROJECTS:
1. ChronoMind AI - Enterprise Temporal Intelligence & Memory Synthesizer
- Multi-modal memory graph integrating voice notes, meeting intelligence, and document memory.
- Real-time semantic retrieval context builder providing 98% accuracy in fact extraction.

EDUCATION:
Bachelor of Computer Applications (BCA) - First Class Honors (2021 - 2024)`;

export default function DocumentLibraryScreen() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'chat'

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [pastedFilename, setPastedFilename] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const fileInputRef = useRef(null);

  // View Document Modal State
  const [selectedDocForView, setSelectedDocForView] = useState(null);

  // Chat State
  const [selectedDocForChat, setSelectedDocForChat] = useState('all');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome_msg',
      sender: 'ai',
      text: 'Hello! I am ChronoMind AI Document Intelligence. Ask me anything about your uploaded documents, resumes, or PDFs.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    loadDocuments();
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await fetchDocuments(searchQuery);
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError('');
      setUploadSuccess('');
      setUploadProgress('Extracting text content from document...');

      const uploadedDoc = await uploadDocument(file);

      setUploadSuccess(`"${file.name}" uploaded and indexed into vector memory!`);
      setUploadProgress('');
      await loadDocuments();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Document processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSampleResume = async () => {
    try {
      setIsUploading(true);
      setUploadError('');
      setUploadSuccess('');
      setUploadProgress('Generating and embedding sample resume PDF/TXT document...');

      const sampleData = {
        textContent: SAMPLE_RESUME_TEXT,
        filename: 'Aradhana_Dubey_Resume_2026.txt',
        mimetype: 'text/plain',
      };

      const doc = await uploadDocument(sampleData);
      setUploadSuccess('Sample Resume "Aradhana_Dubey_Resume_2026.txt" indexed successfully!');
      setUploadProgress('');
      await loadDocuments();
    } catch (err) {
      setUploadError(err.message || 'Failed to index sample resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadPastedText = async () => {
    if (!pastedText.trim()) return;

    try {
      setIsUploading(true);
      setUploadError('');
      setUploadSuccess('');

      const filename = pastedFilename.trim() || `Pasted_Note_${Date.now()}.txt`;
      await uploadDocument({
        textContent: pastedText,
        filename,
        mimetype: 'text/plain',
      });

      setUploadSuccess(`Text note "${filename}" indexed!`);
      setPastedText('');
      setPastedFilename('');
      setShowTextModal(false);
      await loadDocuments();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload text document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.documentId !== id));
      if (selectedDocForView?.documentId === id) setSelectedDocForView(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSendChatMessage = async (presetText = null) => {
    const textToSend = presetText || chatInput;
    if (!textToSend || !textToSend.trim() || chatLoading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setChatLoading(true);

    try {
      const docIdParam = selectedDocForChat === 'all' ? null : selectedDocForChat;
      const responseData = await chatWithDocument(textToSend.trim(), docIdParam);

      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: responseData.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: responseData.documentsUsed || [],
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: `⚠️ Document Chat Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (selectedTypeFilter === 'all') return true;
    return doc.fileType?.toLowerCase() === selectedTypeFilter.toLowerCase();
  });

  const getFileTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">PDF</span>;
      case 'docx':
      case 'doc':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">WORD</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">TXT</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Document Memory RAG</h1>
          </div>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl">
            Upload PDFs, Resumes, TXT files, and Word documents to extract vector embeddings, store chunks in MongoDB Atlas Vector Search, and chat with your content.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleUploadSampleResume}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-950/30 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-200" />}
            Upload Sample Resume
          </button>
          <button
            onClick={() => setShowTextModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-all"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            Paste Text
          </button>
        </div>
      </div>

      {/* Main Mode Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'documents'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Document Library ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Document Chat
          </button>
        </div>

        {activeTab === 'documents' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        )}
      </div>

      {/* DOCUMENT LIBRARY TAB */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* File Upload Drop Area */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-cyan-500/40 transition-all text-center relative group">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-200">
                  Drag & Drop document or <span className="text-cyan-400 underline">browse file</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports PDF, TXT, DOC, DOCX up to 15MB</p>
              </div>
            </div>
          </div>

          {/* Feedback Banners */}
          {isUploading && (
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3 text-cyan-300 text-sm animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span>{uploadProgress || 'Processing document vector embeddings...'}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['all', 'pdf', 'txt', 'docx'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedTypeFilter(filter)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                  selectedTypeFilter === filter
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-slate-800'
                }`}
              >
                {filter === 'all' ? 'All Formats' : filter}
              </button>
            ))}
          </div>

          {/* Document Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mr-3" />
              <span>Loading document memory index...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
              <File className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-300">No Documents Found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No documents in vector store yet. Click "Upload Sample Resume" above or drag & drop a PDF / TXT file to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.documentId}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                        <h4 className="font-semibold text-slate-100 text-sm truncate" title={doc.filename}>
                          {doc.filename}
                        </h4>
                      </div>
                      {getFileTypeBadge(doc.fileType)}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {doc.summary || doc.textContent?.slice(0, 180) + '...'}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                      <span>{doc.chunks?.length || 1} chunks</span>
                      <span className="text-emerald-400 font-medium">✓ Indexed</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 gap-2">
                    <button
                      onClick={() => setSelectedDocForView(doc)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Chunks
                    </button>

                    <button
                      onClick={() => {
                        setSelectedDocForChat(doc.documentId);
                        setActiveTab('chat');
                      }}
                      className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat with File
                    </button>

                    <button
                      onClick={() => handleDelete(doc.documentId, doc.filename)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DOCUMENT CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Config Panel */}
          <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Chat Scope
            </h3>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Target Document:</label>
              <select
                value={selectedDocForChat}
                onChange={(e) => setSelectedDocForChat(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">🌐 All Uploaded Documents</option>
                {documents.map((d) => (
                  <option key={d.documentId} value={d.documentId}>
                    📄 {d.filename}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-300">Quick Prompts:</p>
              <div className="space-y-1.5">
                {[
                  'What skills are mentioned in my resume?',
                  'Summarize my uploaded document.',
                  'What work experience is listed?',
                  'List key technologies and frameworks.',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChatMessage(prompt)}
                    className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/30 text-xs text-slate-300 transition-all flex items-center justify-between group"
                  >
                    <span className="truncate">{prompt}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Chat Window */}
          <div className="lg:col-span-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col h-[580px] overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-tr-none'
                        : msg.isError
                        ? 'bg-rose-950/80 text-rose-200 border border-rose-500/30'
                        : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] opacity-75">
                      <span className="font-semibold">{msg.sender === 'user' ? 'You' : 'ChronoMind AI'}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-cyan-400">
                        <Zap className="w-3 h-3" />
                        <span>Sources used: {msg.sources.map((s) => s.filename).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-cyan-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Searching document vector chunks & generating answer...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask anything about your documents (e.g., 'What skills are in my resume?')..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={() => handleSendChatMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASTE TEXT MODAL */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Paste Raw Document Text
              </h3>
              <button onClick={() => setShowTextModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Document Title (e.g. Project Notes.txt)"
                value={pastedFilename}
                onChange={(e) => setPastedFilename(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <textarea
                rows={7}
                placeholder="Paste plain text content here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowTextModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadPastedText}
                disabled={!pastedText.trim() || isUploading}
                className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-medium hover:bg-cyan-500 disabled:opacity-50"
              >
                Index Text Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DOCUMENT DETAILS & CHUNKS MODAL */}
      {selectedDocForView && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedDocForView.filename}</h3>
                  <p className="text-xs text-slate-400">
                    {(selectedDocForView.fileSize / 1024).toFixed(1)} KB • {selectedDocForView.chunks?.length || 1} Chunk(s) Indexed
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDocForView(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Executive Summary</span>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedDocForView.summary}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200">Vector Chunks ({selectedDocForView.chunks?.length || 0})</h4>
                {selectedDocForView.chunks && selectedDocForView.chunks.length > 0 ? (
                  selectedDocForView.chunks.map((ch, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
                        <span>Chunk #{ch.chunkIndex + 1}</span>
                        <span>Vector Dim: {ch.vectorEmbedding?.length || 768}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{ch.textContent}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Full document stored as single vector chunk.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDocForView(null)}
                className="px-5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
