const MemoryFact = require('../models/MemoryFact');
const { generateEmbedding } = require('../rag/embeddingService');
const { cosineSimilarity } = require('../rag/vectorStore');

// In-memory memory fact store fallback to ensure instant sync & reliability across all runtimes
const inMemoryFacts = new Map(); // memoryId -> memoryObj
let memCounter = 1;

/**
 * Format counter as mem_001, mem_002, etc.
 */
const generateMemoryId = () => {
  const pad = String(memCounter++).padStart(3, '0');
  return `mem_${pad}`;
};

/**
 * Store a newly extracted memory fact according to unique ID memory architecture rules
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.user]
 * @param {string} [params.category='personal']
 * @param {string} params.key - e.g. 'name', 'college', 'origin', 'education', 'skills', 'goals', 'age', 'preferences', 'tasks'
 * @param {string} params.value - e.g. 'Shaalu'
 * @param {string} [params.source='voice'] - 'voice' | 'text' | 'chat' | 'audio'
 * @param {number} [params.confidenceScore=1.0] - Confidence score from 0.0 to 1.0
 * @returns {Promise<Object>} Created memory fact object
 */
const storeMemoryFact = async ({
  userId = 'default_user',
  user = null,
  category = 'personal',
  key,
  value,
  source = 'voice',
  confidenceScore = 1.0,
}) => {
  if (!key || !value || typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalizedUserId = String(userId || 'default_user');
  const normalizedKey = String(key).trim().toLowerCase();
  const normalizedVal = String(value).trim();
  const normalizedCat = String(category || 'personal').trim().toLowerCase();
  const score = typeof confidenceScore === 'number' ? confidenceScore : 1.0;

  // 1. Check existing active memories for this userId and key
  const existingActive = await getActiveMemoryFactByKey(normalizedUserId, normalizedKey);

  if (existingActive) {
    // If value is identical, keep existing memory active, touch updatedAt & update confidence
    if (existingActive.value.toLowerCase() === normalizedVal.toLowerCase()) {
      existingActive.updatedAt = new Date();
      existingActive.confidenceScore = Math.max(existingActive.confidenceScore || 1.0, score);
      inMemoryFacts.set(existingActive.memoryId, existingActive);

      try {
        await MemoryFact.findOneAndUpdate(
          { memoryId: existingActive.memoryId },
          { $set: { updatedAt: new Date(), confidenceScore: existingActive.confidenceScore } }
        );
      } catch (err) {
        // Fallback store
      }

      return existingActive;
    }

    // Value changed! Mark all previous active memories for this key as INACTIVE
    // (Preserve history, do not delete)
    for (const item of inMemoryFacts.values()) {
      if (item.userId === normalizedUserId && item.key === normalizedKey && item.status === 'active') {
        item.status = 'inactive';
        item.updatedAt = new Date();
        inMemoryFacts.set(item.memoryId, item);
      }
    }

    try {
      await MemoryFact.updateMany(
        { userId: normalizedUserId, key: normalizedKey, status: 'active' },
        { $set: { status: 'inactive', updatedAt: new Date() } }
      );
    } catch (err) {
      // Fallback store
    }
  }

  // 2. Create new memory fact with brand new unique memoryId (e.g. mem_001, mem_002)
  const newMemoryId = generateMemoryId();
  const now = new Date();

  const textToEmbed = `${normalizedKey}: ${normalizedVal}`;
  let vectorEmbedding = [];
  try {
    vectorEmbedding = await generateEmbedding(textToEmbed);
  } catch (eErr) {
    // Fallback if embedding service unavailable
  }

  const memoryObj = {
    memoryId: newMemoryId,
    userId: normalizedUserId,
    user: user || null,
    category: normalizedCat,
    key: normalizedKey,
    value: normalizedVal,
    source: source || 'voice',
    confidenceScore: score,
    createdAt: now,
    updatedAt: now,
    status: 'active',
    vectorEmbedding,
  };

  // Save in in-memory store
  inMemoryFacts.set(newMemoryId, memoryObj);

  // Save in Mongo DB if available
  try {
    const docData = {
      memoryId: newMemoryId,
      userId: normalizedUserId,
      category: normalizedCat,
      key: normalizedKey,
      value: normalizedVal,
      source: source || 'voice',
      confidenceScore: score,
      status: 'active',
      vectorEmbedding,
    };
    if (user) docData.user = user;

    await MemoryFact.create(docData);
  } catch (dbErr) {
    // Fallback store handles it
  }

  return memoryObj;
};

/**
 * Get active memory fact by key for a user with conflict resolution:
 * 1. Filter active memories
 * 2. Select latest updated memory
 * 3. Use highest confidence score
 */
const getActiveMemoryFactByKey = async (userId, key) => {
  const normUserId = String(userId || 'default_user');
  const normKey = String(key).trim().toLowerCase();

  // Try DB first if available
  try {
    const docs = await MemoryFact.find({
      userId: normUserId,
      key: normKey,
      status: 'active',
    })
      .sort({ updatedAt: -1, confidenceScore: -1, createdAt: -1 })
      .lean()
      .exec();

    if (docs && docs.length > 0) {
      const topDoc = docs[0];

      // Automatically resolve any legacy duplicate active entries
      if (docs.length > 1) {
        const extraIds = docs.slice(1).map((d) => d.memoryId);
        await MemoryFact.updateMany(
          { memoryId: { $in: extraIds } },
          { $set: { status: 'inactive', updatedAt: new Date() } }
        ).catch(() => {});
      }

      return {
        memoryId: topDoc.memoryId,
        userId: topDoc.userId,
        category: topDoc.category,
        key: topDoc.key,
        value: topDoc.value,
        source: topDoc.source,
        confidenceScore: topDoc.confidenceScore !== undefined ? topDoc.confidenceScore : 1.0,
        createdAt: topDoc.createdAt,
        updatedAt: topDoc.updatedAt,
        status: topDoc.status,
        vectorEmbedding: topDoc.vectorEmbedding || [],
      };
    }
  } catch (err) {
    // Fallback to in-memory store
  }

  // Fallback to in-memory store
  const candidates = [];
  for (const item of inMemoryFacts.values()) {
    if (item.userId === normUserId && item.key === normKey && item.status === 'active') {
      candidates.push(item);
    }
  }

  if (candidates.length === 0) return null;

  // Sorting rules: 1. Active first, 2. Latest updatedAt desc, 3. Highest confidenceScore desc
  candidates.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (b.confidenceScore || 1.0) - (a.confidenceScore || 1.0);
  });

  return candidates[0];
};

/**
 * Get all active memory facts for a user with conflict resolution rules applied
 */
const getAllActiveFacts = async (userId) => {
  const normUserId = String(userId || 'default_user');
  const factsMap = {};

  // Query DB first
  try {
    const docs = await MemoryFact.find({
      userId: normUserId,
      status: 'active',
    })
      .sort({ updatedAt: -1, confidenceScore: -1, createdAt: -1 })
      .lean()
      .exec();

    if (Array.isArray(docs) && docs.length > 0) {
      for (const doc of docs) {
        if (!factsMap[doc.key]) {
          factsMap[doc.key] = {
            memoryId: doc.memoryId,
            userId: doc.userId,
            category: doc.category,
            key: doc.key,
            value: doc.value,
            source: doc.source,
            confidenceScore: doc.confidenceScore !== undefined ? doc.confidenceScore : 1.0,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            status: doc.status,
          };
        }
      }
    }
  } catch (err) {
    // Fallback
  }

  // Merge in-memory facts
  const memCandidates = [];
  for (const item of inMemoryFacts.values()) {
    if (item.userId === normUserId && item.status === 'active') {
      memCandidates.push(item);
    }
  }

  memCandidates.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (b.confidenceScore || 1.0) - (a.confidenceScore || 1.0);
  });

  for (const item of memCandidates) {
    const existing = factsMap[item.key];
    if (!existing) {
      factsMap[item.key] = item;
    } else {
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
      const existingScore = existing.confidenceScore !== undefined ? existing.confidenceScore : 1.0;
      const itemScore = item.confidenceScore !== undefined ? item.confidenceScore : 1.0;

      if (itemTime > existingTime || (itemTime === existingTime && itemScore > existingScore)) {
        factsMap[item.key] = item;
      }
    }
  }

  return factsMap;
};

/**
 * Retrieve memory history for a given key (includes active and inactive)
 */
const getMemoryHistory = async (userId, key) => {
  const normUserId = String(userId || 'default_user');
  const normKey = String(key).trim().toLowerCase();

  const history = [];

  try {
    const docs = await MemoryFact.find({ userId: normUserId, key: normKey })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (docs) history.push(...docs);
  } catch (e) {
    // Fallback
  }

  for (const item of inMemoryFacts.values()) {
    if (item.userId === normUserId && item.key === normKey) {
      if (!history.some((h) => h.memoryId === item.memoryId)) {
        history.push(item);
      }
    }
  }

  history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return history;
};

/**
 * Search active memories by semantic similarity vector
 */
const searchActiveFactsVector = async ({ userId, queryVector, category = null, limit = 5, minScore = 0.25 }) => {
  const activeFacts = await getAllActiveFacts(userId);
  const factList = Object.values(activeFacts);

  if (!queryVector || factList.length === 0) return [];

  const scored = [];
  for (const fact of factList) {
    if (category && fact.category.toLowerCase() !== category.toLowerCase()) {
      continue;
    }
    let vec = fact.vectorEmbedding;
    if (!vec || vec.length === 0) {
      try {
        vec = await generateEmbedding(`${fact.key}: ${fact.value}`);
      } catch (e) {
        vec = [];
      }
    }

    if (vec && vec.length > 0) {
      const score = cosineSimilarity(queryVector, vec);
      if (score >= minScore) {
        scored.push({
          fact,
          score,
        });
      }
    } else {
      // Fallback base match
      scored.push({ fact, score: 0.5 });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.fact);
};

/**
 * Clear in-memory facts (for testing/resetting)
 */
const clearMemoryFactStore = () => {
  inMemoryFacts.clear();
  memCounter = 1;
};

/**
 * Retrieve full memory timeline for a user (both active and inactive memories)
 */
const getMemoryTimeline = async (userId) => {
  const normUserId = String(userId || 'default_user');
  const timelineMap = new Map();

  try {
    const docs = await MemoryFact.find({ userId: normUserId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (Array.isArray(docs)) {
      for (const doc of docs) {
        timelineMap.set(doc.memoryId, {
          memoryId: doc.memoryId,
          userId: doc.userId,
          category: doc.category,
          key: doc.key,
          value: doc.value,
          source: doc.source,
          confidenceScore: doc.confidenceScore !== undefined ? doc.confidenceScore : 1.0,
          status: doc.status,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        });
      }
    }
  } catch (e) {
    // Fallback
  }

  for (const item of inMemoryFacts.values()) {
    if (item.userId === normUserId) {
      if (!timelineMap.has(item.memoryId)) {
        timelineMap.set(item.memoryId, {
          memoryId: item.memoryId,
          userId: item.userId,
          category: item.category,
          key: item.key,
          value: item.value,
          source: item.source,
          confidenceScore: item.confidenceScore !== undefined ? item.confidenceScore : 1.0,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      }
    }
  }

  const list = Array.from(timelineMap.values());
  list.sort((a, b) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime());
  return list;
};

/**
 * Retrieve memory history grouped by key for a user
 */
const getGroupedMemoryHistory = async (userId) => {
  const timeline = await getMemoryTimeline(userId);
  const grouped = {};

  for (const item of timeline) {
    const key = item.key.toLowerCase();
    if (!grouped[key]) {
      grouped[key] = {
        key: item.key,
        active: null,
        history: [],
        allValues: [],
      };
    }

    if (item.status === 'active' && !grouped[key].active) {
      grouped[key].active = item;
    } else {
      grouped[key].history.push(item);
    }
    if (!grouped[key].allValues.includes(item.value)) {
      grouped[key].allValues.push(item.value);
    }
  }

  return grouped;
};

module.exports = {
  generateMemoryId,
  storeMemoryFact,
  getActiveMemoryFactByKey,
  getAllActiveFacts,
  getMemoryHistory,
  getMemoryTimeline,
  getGroupedMemoryHistory,
  searchActiveFactsVector,
  clearMemoryFactStore,
};
