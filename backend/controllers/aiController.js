const geminiService = require('../services/geminiService');
const Conversation = require('../models/Conversation');
const { indexNewMemoryItem, clearRetrievalCache } = require('../rag/ragService');
const { extractStructuredFacts } = require('../rag/contextBuilder');

/**
 * @desc    Generate structured meeting summary using Gemini AI
 * @route   POST /api/v1/ai/summary
 * @access  Private
 */
const generateSummary = async (req, res, next) => {
  try {
    const transcript = req.body.transcript || req.body.text || req.body.content || req.body.conversation;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid conversation transcript in the request body.',
      });
    }

    const summaryData = await geminiService.generateMeetingSummary(transcript.trim(), req.user?.id);

    res.status(200).json({
      success: true,
      message: 'Meeting summary generated successfully',
      data: summaryData,
    });
  } catch (error) {
    if (error.message && error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: 'AI Service Configuration Error: Gemini API key is missing or invalid.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Extract key strategic and technical decisions from a transcript
 * @route   POST /api/v1/ai/decisions
 * @access  Private
 */
const analyzeDecisions = async (req, res, next) => {
  try {
    const transcript = req.body.transcript || req.body.text || req.body.content || req.body.conversation;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid conversation transcript in the request body.',
      });
    }

    const decisions = await geminiService.extractDecisions(transcript.trim(), req.user?.id);

    res.status(200).json({
      success: true,
      count: decisions.length,
      message: `${decisions.length} decision(s) extracted successfully`,
      data: decisions,
    });
  } catch (error) {
    if (error.message && error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: 'AI Service Configuration Error: Gemini API key is missing or invalid.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Extract actionable tasks and action items from a transcript
 * @route   POST /api/v1/ai/tasks
 * @access  Private
 */
const generateTasks = async (req, res, next) => {
  try {
    const transcript = req.body.transcript || req.body.text || req.body.content || req.body.conversation;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid conversation transcript in the request body.',
      });
    }

    const tasks = await geminiService.extractTasks(transcript.trim(), req.user?.id);

    res.status(200).json({
      success: true,
      count: tasks.length,
      message: `${tasks.length} task(s) generated successfully`,
      data: tasks,
    });
  } catch (error) {
    if (error.message && error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: 'AI Service Configuration Error: Gemini API key is missing or invalid.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Generate RAG-augmented temporal chat response
 * @route   POST /api/v1/ai/chat
 * @access  Private
 */
const generateTemporalChat = async (req, res, next) => {
  try {
    const prompt = req.body.prompt || req.body.question || req.body.userMessage || req.body.message || req.body.text;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a prompt or query string in request body.',
      });
    }

    const cleanPrompt = prompt.trim();
    const userId = req.user?.id;
    const isAudio = req.body.source === 'audio' || req.body.isAudio === true || req.body.sourceSession === 'audio';

    const lowerPrompt = cleanPrompt.toLowerCase();

    const isQuestion =
      cleanPrompt.endsWith('?') ||
      /^(what|where|who|when|why|how|tell\s+me|show\s+me|can\s+you|did|is|are|do|does)/i.test(cleanPrompt);

    // Detect if this prompt is an audio voice note or user personal/declarative memory statement
    const isMemoryStatement =
      !isQuestion &&
      (isAudio ||
        lowerPrompt.startsWith('i am ') ||
        lowerPrompt.startsWith("i'm ") ||
        lowerPrompt.startsWith('my ') ||
        lowerPrompt.includes('save this') ||
        lowerPrompt.includes('remember that') ||
        lowerPrompt.includes('remember my') ||
        lowerPrompt.includes('preparing for') ||
        lowerPrompt.includes('working on') ||
        lowerPrompt.includes('i live in') ||
        lowerPrompt.includes('i work at') ||
        lowerPrompt.includes('my name is') ||
        lowerPrompt.includes('sister') ||
        lowerPrompt.includes('brother') ||
        lowerPrompt.includes('college') ||
        lowerPrompt.includes('role'));

    if (isMemoryStatement) {
      try {
        const sourceLabel = isAudio ? 'Audio Voice Note' : 'User Saved Personal Vault';

        // Extract structured facts with unique memoryId
        await extractStructuredFacts(
          [{ content: cleanPrompt, title: cleanPrompt, category: 'Personal', sourceSession: sourceLabel }],
          userId || 'default_user',
          true
        );

        if (userId) {
          // Automatically persist audio/personal memory to database
          const newPersonalMem = await Conversation.create({
            user: userId,
            title: isAudio ? 'Audio Voice Note' : 'Personal Memory Vault',
            transcript: cleanPrompt,
            notes: cleanPrompt,
            category: 'Personal',
            isPinned: true,
            retentionScore: 100,
            sourceSession: sourceLabel,
            contextSnippet: cleanPrompt,
          });

          // Generate vector embedding and index in MongoDB vector store
          await indexNewMemoryItem({
            modelName: 'conversation',
            documentId: newPersonalMem._id,
            textContent: `${sourceLabel}: ${cleanPrompt}`,
            extraFields: {
              category: 'Personal',
              isPinned: true,
              sourceSession: sourceLabel,
            },
          }).catch((idxErr) => {
            console.warn('[AI Controller] Indexing warning:', idxErr.message);
          });
        }

        clearRetrievalCache();
      } catch (saveErr) {
        console.warn('[AI Controller] Failed to auto-save memory entry:', saveErr.message);
      }
    }

    const chatResponse = await geminiService.generateTemporalChatResponse({
      prompt: cleanPrompt,
      userId,
    });

    res.status(200).json({
      success: true,
      data: chatResponse,
    });
  } catch (error) {
    if (error.message && error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: 'AI Service Configuration Error: Gemini API key is missing or invalid.',
      });
    }
    next(error);
  }
};

const {
  getAllActiveFacts,
  getMemoryHistory,
  getMemoryTimeline,
  getGroupedMemoryHistory,
  storeMemoryFact,
} = require('../services/memoryFactStore');

/**
 * @desc    Get all active unique memory facts, timeline, and history
 * @route   GET /api/v1/ai/memories
 * @access  Private
 */
const getMemoryFacts = async (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const activeFacts = await getAllActiveFacts(userId);
    const timeline = await getMemoryTimeline(userId);
    const historyGrouped = await getGroupedMemoryHistory(userId);

    let keyHistory = [];
    if (req.query.key) {
      keyHistory = await getMemoryHistory(userId, req.query.key);
    }

    return res.status(200).json({
      success: true,
      activeFacts,
      timeline,
      historyGrouped,
      history: keyHistory,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Store a unique ID memory fact
 * @route   POST /api/v1/ai/memories
 * @access  Private
 */
const createMemoryFact = async (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { key, value, category, source } = req.body;
    if (!key || !value) {
      return res.status(400).json({ success: false, error: 'Key and value are required' });
    }
    const memoryObj = await storeMemoryFact({
      userId,
      user: req.user?._id || null,
      key,
      value,
      category: category || 'personal',
      source: source || 'text',
    });
    return res.status(201).json({
      success: true,
      data: memoryObj,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  generateSummary,
  analyzeDecisions,
  generateTasks,
  generateTemporalChat,
  getMemoryFacts,
  createMemoryFact,
};
