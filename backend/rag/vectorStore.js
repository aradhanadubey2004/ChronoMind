const mongoose = require('mongoose');
const { generateEmbedding } = require('./embeddingService');
const Conversation = require('../models/Conversation');
const Decision = require('../models/Decision');
const Task = require('../models/Task');
const ChatHistory = require('../models/ChatHistory');
const Document = require('../models/Document');
const Meeting = require('../models/Meeting');

/**
 * Vector Store for ChronoMind AI RAG Architecture
 * Manages MongoDB Atlas Vector Search pipelines with intelligent fallback
 * for hybrid vector/semantic search and user isolation.
 */

/**
 * Calculate Cosine Similarity between two 768-dim vectors
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Score between -1 and 1
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Map collection or model key to Mongoose Model
 */
const getModel = (collectionType) => {
  switch (collectionType?.toLowerCase()) {
    case 'conversations':
    case 'conversation':
      return Conversation;
    case 'decisions':
    case 'decision':
      return Decision;
    case 'tasks':
    case 'task':
      return Task;
    case 'chathistory':
    case 'chat':
      return ChatHistory;
    case 'documents':
    case 'document':
      return Document;
    case 'meetings':
    case 'meeting':
      return Meeting;
    default:
      return null;
  }
};

/**
 * Index a document by generating its vector embedding and saving it to MongoDB
 * @param {Object} params
 * @param {string} params.modelName - 'conversation' | 'decision' | 'task' | 'chat'
 * @param {string} params.documentId - Document _id
 * @param {string} params.textContent - Text chunk to embed
 * @param {Object} [params.extraFields] - Additional fields to persist
 */
const indexDocument = async ({ modelName, documentId, textContent, extraFields = {} }) => {
  try {
    const Model = getModel(modelName);
    if (!Model) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    if (!textContent || !textContent.trim()) {
      return null;
    }

    const vectorEmbedding = await generateEmbedding(textContent);

    const updatedDoc = await Model.findByIdAndUpdate(
      documentId,
      {
        $set: {
          vectorEmbedding,
          lastIndexedAt: new Date(),
          ...extraFields,
        },
      },
      { new: true }
    );

    return updatedDoc;
  } catch (error) {
    console.warn(`[RAG VectorStore] Error indexing ${modelName} (${documentId}):`, error.message);
    return null;
  }
};

/**
 * Perform Semantic Vector Search across a specific MongoDB collection
 * Uses Atlas Vector Search `$vectorSearch` pipeline if configured,
 * with fallback to exact user-scoped in-memory cosine ranking.
 *
 * @param {Object} params
 * @param {string} params.userId - Owner user ID for strict security isolation
 * @param {string} params.modelName - Target collection type
 * @param {number[]} params.queryVector - 768-dim query embedding vector
 * @param {number} [params.limit=5] - Maximum top results
 * @param {number} [params.minScore=0.3] - Minimum similarity threshold
 * @param {Object} [params.filter={}] - Optional metadata filters (e.g., category, isPinned)
 * @returns {Promise<Array<{doc: Object, score: number}>>}
 */
const searchVectorStore = async ({
  userId,
  modelName,
  queryVector,
  limit = 5,
  minScore = 0.3,
  filter = {},
}) => {
  const Model = getModel(modelName);
  if (!Model || !userId || !queryVector) {
    return [];
  }

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const targetUserIdStr = userId.toString();

  // 1. Try MongoDB Atlas Vector Search Pipeline
  try {
    const atlasPipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'vectorEmbedding',
          queryVector,
          numCandidates: limit * 10,
          limit,
          filter: {
            user: userObjectId,
            ...filter,
          },
        },
      },
      {
        $addFields: {
          score: { $meta: 'vectorSearchScore' },
        },
      },
      {
        $match: {
          score: { $gte: minScore },
        },
      },
    ];

    const results = await Model.aggregate(atlasPipeline);
    if (Array.isArray(results) && results.length > 0) {
      // Enforce strict userId check on results
      const userIsolatedResults = results.filter(
        (doc) => doc.user && doc.user.toString() === targetUserIdStr
      );

      if (userIsolatedResults.length > 0) {
        return userIsolatedResults.map((doc) => ({
          doc,
          score: Number((doc.score || 0).toFixed(4)),
          source: 'atlas_vector_search',
        }));
      }
    }
  } catch (atlasErr) {
    // Atlas Vector search index might not be configured on local or standard MongoDB instance
    // Fall back gracefully to in-memory cosine similarity ranking
  }

  // 2. In-Memory Cosine Similarity Fallback (User-Isolated)
  try {
    const queryFilter = { user: userId, ...filter };
    const candidates = await Model.find(queryFilter).lean().exec();

    if (!candidates || candidates.length === 0) {
      return [];
    }

    const scoredResults = [];

    for (const doc of candidates) {
      // Enforce strict userId isolation check
      if (!doc.user || doc.user.toString() !== targetUserIdStr) {
        continue;
      }

      let docVector = doc.vectorEmbedding;

      // If document is missing embedding vector, generate it lazily
      if (!docVector || !Array.isArray(docVector) || docVector.length === 0) {
        const textToEmbed = doc.transcript || doc.summary || doc.content || doc.title || doc.description || '';
        if (textToEmbed) {
          docVector = await generateEmbedding(textToEmbed);
          // Async update in background
          Model.findByIdAndUpdate(doc._id, { $set: { vectorEmbedding: docVector } }).catch(() => {});
        }
      }

      if (docVector && Array.isArray(docVector) && docVector.length > 0) {
        const score = cosineSimilarity(queryVector, docVector);
        if (score >= minScore) {
          scoredResults.push({
            doc,
            score: Number(score.toFixed(4)),
            source: 'cosine_similarity_fallback',
          });
        }
      }
    }

    // Sort descending by score and slice to requested limit
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, limit);
  } catch (err) {
    console.error(`[RAG VectorStore] Search failed for ${modelName}:`, err.message);
    return [];
  }
};

module.exports = {
  cosineSimilarity,
  indexDocument,
  searchVectorStore,
};
