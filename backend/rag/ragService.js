const { generateEmbedding } = require('./embeddingService');
const { retrieveRelevantContext } = require('./retrievalService');
const { rerankContextItems } = require('./reranker');
const { buildAugmentedContext } = require('./contextBuilder');
const { indexDocument } = require('./vectorStore');
const User = require('../models/User');

/**
 * Central RAG Orchestration Service for ChronoMind AI
 * Executes the complete 11-step Retrieval-Augmented Generation pipeline:
 * 1. Generate query embedding
 * 2. Perform MongoDB Atlas Vector Search
 * 3. Retrieve conversation history
 * 4. Retrieve pinned memories
 * 5. Retrieve decision records
 * 6. Retrieve active tasks
 * 7. Retrieve user profile memory
 * 8. Merge all retrieved results
 * 9. Re-rank using reranker.js
 * 10. Build final context using contextBuilder.js
 * 11. Return structured context payload for Gemini
 */

// In-memory retrieval cache to prevent redundant query calculations
const retrievalCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache TTL
const MAX_CACHE_ENTRIES = 500;

/**
 * Clean up expired retrieval cache items
 */
const pruneCache = () => {
  const now = Date.now();
  for (const [key, entry] of retrievalCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      retrievalCache.delete(key);
    }
  }
};

/**
 * Main Orchestration Endpoint: Executes full RAG retrieval pipeline for a given query and user
 * @param {Object} params
 * @param {string} params.userId - Authenticated User ID
 * @param {string} params.query - Natural language prompt/query
 * @param {Object} [params.options] - Search and ranking tuning options
 * @param {number} [params.options.limitPerDomain=3]
 * @param {number} [params.options.topK=8]
 * @param {string} [params.options.basePrompt] - Existing prompt to augment
 * @returns {Promise<Object>} Augmented context payload for Gemini API consumption
 */
const orchestrateRAGContext = async ({ userId, query, options = {} }) => {
  if (!userId || !query || typeof query !== 'string' || !query.trim()) {
    const emptyContext = await buildAugmentedContext({
      rankedItems: [],
      userProfile: null,
      basePrompt: options.basePrompt || '',
      userId: userId || 'default_user',
    });
    return {
      ...emptyContext,
      query: query || '',
      userId: userId || null,
      retrievedCount: 0,
    };
  }

  const normalizedQuery = query.trim();
  const cacheKey = `${userId}:${normalizedQuery.toLowerCase()}`;

  // Check cache
  if (retrievalCache.has(cacheKey)) {
    const cachedEntry = retrievalCache.get(cacheKey);
    if (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      return cachedEntry.data;
    }
  }

  try {
    // 1. Fetch User Profile Memory
    let userProfile = null;
    try {
      userProfile = await User.findById(userId).select('name email preferences').lean().exec();
    } catch (uErr) {
      // Non-blocking if database user fetch fails
    }

    // 2-8. Execute Parallel Vector & Semantic Retrieval across Conversations, Pinned, Decisions, Tasks & Chat
    const rawRetrievalResults = await retrieveRelevantContext({
      userId,
      query: normalizedQuery,
      options: {
        limitPerDomain: options.limitPerDomain || 3,
        minScore: options.minScore || 0.20,
      },
    });

    // 9. Multi-factor Re-ranking & Deduplication
    const rankedItems = rerankContextItems(rawRetrievalResults.allResults, {
      query: normalizedQuery,
      topK: options.topK || 8,
      minFinalScore: options.minFinalScore || 0.20,
    });

    // 10. Construct Token-Aware Augmented Context Prompt for Gemini
    const augmentedPayload = await buildAugmentedContext({
      rankedItems,
      userProfile,
      basePrompt: options.basePrompt || '',
      query: normalizedQuery,
      userId,
    });

    const result = {
      ...augmentedPayload,
      query: normalizedQuery,
      userId,
      retrievedCount: rankedItems.length,
      rawCandidatesCount: rawRetrievalResults.allResults.length,
      domainsCovered: augmentedPayload.itemCounts,
      isCached: false,
      timestamp: new Date(),
    };

    // Cache the result
    if (retrievalCache.size >= MAX_CACHE_ENTRIES) {
      pruneCache();
      if (retrievalCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = retrievalCache.keys().next().value;
        retrievalCache.delete(firstKey);
      }
    }

    retrievalCache.set(cacheKey, {
      timestamp: Date.now(),
      data: { ...result, isCached: true },
    });

    return result;
  } catch (error) {
    console.error('[RAG Service] Pipeline orchestration error:', error.message);
    const fallbackPayload = buildAugmentedContext({
      rankedItems: [],
      userProfile: null,
      basePrompt: options.basePrompt || '',
    });

    return {
      ...fallbackPayload,
      query: normalizedQuery,
      userId,
      retrievedCount: 0,
      error: error.message,
    };
  }
};

/**
 * Index or update a document in the Vector Store (Background indexing)
 * @param {Object} params
 * @param {string} params.modelName - 'conversation' | 'decision' | 'task' | 'chat'
 * @param {string} params.documentId - Document ID
 * @param {string} params.textContent - Text chunk to embed
 * @param {Object} [params.extraFields]
 */
const indexNewMemoryItem = async ({ modelName, documentId, textContent, extraFields = {} }) => {
  try {
    return await indexDocument({ modelName, documentId, textContent, extraFields });
  } catch (err) {
    console.warn(`[RAG Service] Background indexing failed for ${modelName}:${documentId}`, err.message);
    return null;
  }
};

/**
 * Flush memory cache manually
 */
const clearRetrievalCache = () => {
  retrievalCache.clear();
};

module.exports = {
  orchestrateRAGContext,
  indexNewMemoryItem,
  clearRetrievalCache,
};
