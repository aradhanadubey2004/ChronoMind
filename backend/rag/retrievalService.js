const { generateEmbedding } = require('./embeddingService');
const { searchVectorStore, cosineSimilarity } = require('./vectorStore');
const { searchActiveFactsVector } = require('../services/memoryFactStore');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');

/**
 * Retrieval Service for ChronoMind AI RAG Architecture
 * Executes parallel semantic searches across conversations, decisions, tasks,
 * chat history, and active unique memory facts with user isolation and similarity score ranking.
 */

/**
 * Perform exact person-specific candidate retrieval for task & meeting queries
 */
const getPersonSpecificHits = async ({ userId, query, queryVector }) => {
  if (!userId || !query || !queryVector) return { personTasks: [], personMeetings: [] };

  try {
    const [userMeetings, userTasks] = await Promise.all([
      Meeting.find({ user: userId }).lean().exec(),
      Task.find({ user: userId }).lean().exec(),
    ]);

    const candidateNames = new Set();

    if (Array.isArray(userMeetings)) {
      for (const m of userMeetings) {
        if (Array.isArray(m.peopleMentioned)) {
          for (const p of m.peopleMentioned) {
            if (p && typeof p === 'string' && p.trim().length > 1) {
              candidateNames.add(p.trim().toLowerCase());
            }
          }
        }
        if (Array.isArray(m.actionItems)) {
          for (const item of m.actionItems) {
            if (item && item.assignee && typeof item.assignee === 'string' && item.assignee.trim().length > 1 && item.assignee.toLowerCase() !== 'unassigned' && item.assignee.toLowerCase() !== 'team') {
              candidateNames.add(item.assignee.trim().toLowerCase());
            }
          }
        }
      }
    }

    if (Array.isArray(userTasks)) {
      for (const t of userTasks) {
        if (t.description) {
          const match = t.description.match(/Assigned to:\s*([^.\n]+)/i);
          if (match && match[1]) {
            const name = match[1].trim();
            if (name.length > 1 && name.toLowerCase() !== 'unassigned' && name.toLowerCase() !== 'team') {
              candidateNames.add(name.toLowerCase());
            }
          }
        }
      }
    }

    const queryLower = query.toLowerCase();
    const matchedNames = [];

    for (const name of candidateNames) {
      if (queryLower.includes(name)) {
        matchedNames.push(name);
      }
    }

    if (matchedNames.length === 0) {
      const tokens = query.split(/\s+/).map((t) => t.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '')).filter(Boolean);
      const stopWords = new Set(['ko', 'kya', 'ka', 'ki', 'ke', 'task', 'mila', 'tha', 'thi', 'the', 'aaj', 'kal', 'diya', 'gya', 'gaya', 'hai', 'hain', 'h', 'what', 'was', 'given', 'assigned', 'to', 'for', 'is', 'the', 'a', 'an', 'me', 'my', 'test']);

      for (const token of tokens) {
        if (token.length >= 3 && !stopWords.has(token.toLowerCase())) {
          const tokenLower = token.toLowerCase();
          const foundInMeeting = (userMeetings || []).some((m) => (m.transcript && m.transcript.toLowerCase().includes(tokenLower)) || (m.summary && m.summary.toLowerCase().includes(tokenLower)));
          const foundInTask = (userTasks || []).some((t) => (t.title && t.title.toLowerCase().includes(tokenLower)) || (t.description && t.description.toLowerCase().includes(tokenLower)));
          if (foundInMeeting || foundInTask) {
            matchedNames.push(tokenLower);
          }
        }
      }
    }

    if (matchedNames.length === 0) {
      return { personTasks: [], personMeetings: [] };
    }

    const matchedTasks = [];
    const matchedMeetings = [];

    if (Array.isArray(userTasks)) {
      for (const taskDoc of userTasks) {
        const taskText = `${taskDoc.title || ''} ${taskDoc.description || ''}`.toLowerCase();
        const isMatch = matchedNames.some((name) => taskText.includes(name));
        if (isMatch) {
          let score = 0;
          if (taskDoc.vectorEmbedding && Array.isArray(taskDoc.vectorEmbedding) && taskDoc.vectorEmbedding.length > 0) {
            score = cosineSimilarity(queryVector, taskDoc.vectorEmbedding);
          }
          const effectiveScore = Math.max(score, 0.65);
          matchedTasks.push({
            doc: taskDoc,
            score: effectiveScore,
            source: 'person_exact_match',
          });
        }
      }
    }

    if (Array.isArray(userMeetings)) {
      for (const meetingDoc of userMeetings) {
        const meetingText = `${meetingDoc.title || ''} ${meetingDoc.transcript || ''} ${meetingDoc.summary || ''} ${(meetingDoc.peopleMentioned || []).join(' ')}`.toLowerCase();
        const isMatch = matchedNames.some((name) => meetingText.includes(name));
        if (isMatch) {
          let score = 0;
          if (meetingDoc.vectorEmbedding && Array.isArray(meetingDoc.vectorEmbedding) && meetingDoc.vectorEmbedding.length > 0) {
            score = cosineSimilarity(queryVector, meetingDoc.vectorEmbedding);
          }
          const effectiveScore = Math.max(score, 0.65);
          matchedMeetings.push({
            doc: meetingDoc,
            score: effectiveScore,
            source: 'person_exact_match',
          });
        }
      }
    }

    return { personTasks: matchedTasks, personMeetings: matchedMeetings };
  } catch (err) {
    console.warn('[RAG RetrievalService] Error in person-specific retrieval:', err.message);
    return { personTasks: [], personMeetings: [] };
  }
};

/**
 * Perform unified semantic retrieval across all memory stores for a given user query
 * @param {Object} params
 * @param {string} params.userId - User ID for strict security isolation
 * @param {string} params.query - Natural language query string
 * @param {Object} [params.options] - Search tuning options
 * @param {number} [params.options.limitPerDomain=3] - Max results per collection
 * @param {number} [params.options.minScore=0.25] - Minimum similarity threshold
 * @returns {Promise<Object>} Categorized and ranked semantic context results
 */
const retrieveRelevantContext = async ({ userId, query, options = {} }) => {
  if (!userId || !query || typeof query !== 'string' || !query.trim()) {
    return {
      conversations: [],
      pinnedMemories: [],
      decisions: [],
      tasks: [],
      chatHistory: [],
      allResults: [],
      query: query || '',
      hasContext: false,
    };
  }

  const { limitPerDomain = 3, minScore = 0.25 } = options;
  const normalizedQuery = query.trim();

  try {
    // 1. Generate query embedding vector
    const queryVector = await generateEmbedding(normalizedQuery);

    // 2. Execute parallel vector searches across core domains, documents, meetings and active memory facts
    const [conversationHits, pinnedHits, decisionHits, taskHits, chatHits, documentHits, meetingHits, activeMemoryFacts, personHits] = await Promise.all([
      // General Conversations
      searchVectorStore({
        userId,
        modelName: 'conversation',
        queryVector,
        limit: limitPerDomain,
        minScore,
      }),
      // Pinned Conversations / Key Knowledge
      searchVectorStore({
        userId,
        modelName: 'conversation',
        queryVector,
        limit: limitPerDomain,
        minScore,
        filter: { isPinned: true },
      }),
      // Decision Graph
      searchVectorStore({
        userId,
        modelName: 'decision',
        queryVector,
        limit: limitPerDomain,
        minScore,
      }),
      // Active / Archived Tasks
      searchVectorStore({
        userId,
        modelName: 'task',
        queryVector,
        limit: limitPerDomain,
        minScore,
      }),
      // Recent Chat History
      searchVectorStore({
        userId,
        modelName: 'chat',
        queryVector,
        limit: limitPerDomain,
        minScore,
      }),
      // Uploaded Document Memory
      searchVectorStore({
        userId,
        modelName: 'document',
        queryVector,
        limit: limitPerDomain,
        minScore,
      }),
      // Meeting Transcripts & Intelligence
      searchVectorStore({
        userId,
        modelName: 'meeting',
        queryVector,
        limit: limitPerDomain,
        minScore,
      }),
      // Unique ID Active Memory Facts
      searchActiveFactsVector({
        userId,
        queryVector,
        minScore,
        limit: limitPerDomain,
      }),
      // Person-specific task & meeting matches
      getPersonSpecificHits({
        userId,
        query: normalizedQuery,
        queryVector,
      }),
    ]);

    // Format helper for clean context injection
    const formatHit = (hit, type) => ({
      id: hit.doc._id?.toString() || hit.doc.documentId || hit.doc.meetingId,
      type,
      title: hit.doc.filename || hit.doc.title || hit.doc.summary || hit.doc.userQuery || 'Memory Item',
      content: hit.doc.transcript || hit.doc.textContent || hit.doc.summary || hit.doc.description || hit.doc.content || hit.doc.aiResponse || '',
      category: hit.doc.fileType || hit.doc.category || 'General',
      score: hit.doc.confidenceScore || hit.score,
      similarityScore: hit.score,
      createdAt: hit.doc.createdAt || hit.doc.timestamp || new Date(),
      isPinned: Boolean(hit.doc.isPinned || type === 'document'),
      metadata: hit.doc,
    });

    const allTaskHits = [...(personHits?.personTasks || []), ...taskHits];
    const allMeetingHits = [...(personHits?.personMeetings || []), ...meetingHits];

    const formattedConversations = conversationHits.map((h) => formatHit(h, 'conversation'));
    const formattedPinned = pinnedHits.map((h) => formatHit(h, 'pinned_memory'));
    const formattedDecisions = decisionHits.map((h) => formatHit(h, 'decision'));
    const formattedTasks = allTaskHits.map((h) => formatHit(h, 'task'));
    const formattedChat = chatHits.map((h) => formatHit(h, 'chat_history'));
    const formattedDocuments = documentHits.map((h) => formatHit(h, 'document'));
    const formattedMeetings = allMeetingHits.map((h) => formatHit(h, 'meeting'));
    const formattedActiveFacts = activeMemoryFacts.map((fact) => ({
      id: fact.memoryId,
      memoryId: fact.memoryId,
      type: 'personal_memory',
      title: `${fact.key.charAt(0).toUpperCase() + fact.key.slice(1)}: ${fact.value}`,
      content: `${fact.key}: ${fact.value}`,
      category: fact.category || 'personal',
      key: fact.key,
      value: fact.value,
      score: 0.98,
      similarityScore: 0.98,
      createdAt: fact.createdAt,
      status: fact.status || 'active',
      isPinned: true,
    }));

    // Deduplicate and combine all results
    const seenIds = new Set();
    const allResults = [];

    const addUnique = (items) => {
      for (const item of items) {
        if (item.id && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          allResults.push(item);
        }
      }
    };

    addUnique(formattedActiveFacts);
    addUnique(formattedMeetings);
    addUnique(formattedDocuments);
    addUnique(formattedPinned);
    addUnique(formattedConversations);
    addUnique(formattedDecisions);
    addUnique(formattedTasks);
    addUnique(formattedChat);

    // Sort unified list descending by similarity score
    allResults.sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      documents: formattedDocuments,
      meetings: formattedMeetings,
      conversations: formattedConversations,
      pinnedMemories: formattedPinned,
      decisions: formattedDecisions,
      tasks: formattedTasks,
      chatHistory: formattedChat,
      allResults,
      query: normalizedQuery,
      hasContext: allResults.length > 0,
    };
  } catch (error) {
    console.error('[RAG RetrievalService] Error during context retrieval:', error.message);
    return {
      conversations: [],
      pinnedMemories: [],
      decisions: [],
      tasks: [],
      chatHistory: [],
      allResults: [],
      query: normalizedQuery,
      hasContext: false,
    };
  }
};

module.exports = {
  retrieveRelevantContext,
};
