const { GoogleGenAI } = require('@google/genai');

/**
 * Embedding Service for ChronoMind AI RAG Architecture
 * Uses Google GenAI text-embedding-004 model with in-memory caching & batch processing.
 */

// In-memory cache for generated embeddings (LRU-style map)
const embeddingCache = new Map();
const MAX_CACHE_SIZE = 1000;
const EMBEDDING_MODEL = 'text-embedding-004';
const VECTOR_DIMENSION = 768;

/**
 * Initialize Google GenAI client lazily
 */
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required for embeddings.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-rag',
      },
    },
  });
};

/**
 * Deterministic fallback vector generation when API key is absent or network fails.
 * Ensures local development or offline testing never halts.
 * @param {string} text 
 * @returns {number[]} 768-dim float array normalized
 */
const generateFallbackEmbedding = (text) => {
  const vector = new Array(VECTOR_DIMENSION).fill(0);
  if (!text) return vector;

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    const seed = hash + i * 31;
    vector[i] = (Math.sin(seed) + 1) / 2; // Normalize between 0 and 1
  }

  // L2 Norm normalization
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((val) => Number((val / magnitude).toFixed(6)));
};

/**
 * Generate embedding for a single text chunk
 * @param {string} text - Content to embed
 * @returns {Promise<number[]>} 768-dim vector embedding
 */
const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return new Array(VECTOR_DIMENSION).fill(0);
  }

  const normalizedText = text.trim().slice(0, 8000); // Guard against token limits

  // Check cache
  if (embeddingCache.has(normalizedText)) {
    return embeddingCache.get(normalizedText);
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: normalizedText,
    });

    let vector = null;
    if (response && response.embedding && response.embedding.values) {
      vector = response.embedding.values;
    } else if (response && response.values) {
      vector = response.values;
    }

    if (!vector || !Array.isArray(vector) || vector.length === 0) {
      vector = generateFallbackEmbedding(normalizedText);
    }

    // Maintain cache size
    if (embeddingCache.size >= MAX_CACHE_SIZE) {
      const firstKey = embeddingCache.keys().next().value;
      embeddingCache.delete(firstKey);
    }

    embeddingCache.set(normalizedText, vector);
    return vector;
  } catch (error) {
    console.warn('[RAG EmbeddingService] API embedding generation failed, using fallback:', error.message);
    const fallbackVector = generateFallbackEmbedding(normalizedText);
    embeddingCache.set(normalizedText, fallbackVector);
    return fallbackVector;
  }
};

/**
 * Batch embedding generation for multiple text items
 * @param {string[]} textArray - Array of string chunks
 * @returns {Promise<number[][]>} Array of vector embeddings
 */
const generateBatchEmbeddings = async (textArray) => {
  if (!Array.isArray(textArray) || textArray.length === 0) {
    return [];
  }

  const results = [];
  // Process in concurrent batches of 5
  const BATCH_SIZE = 5;
  for (let i = 0; i < textArray.length; i += BATCH_SIZE) {
    const chunk = textArray.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(chunk.map((item) => generateEmbedding(item)));
    results.push(...batchResults);
  }

  return results;
};

/**
 * Clear the embedding cache
 */
const clearCache = () => {
  embeddingCache.clear();
};

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  clearCache,
  VECTOR_DIMENSION,
};
