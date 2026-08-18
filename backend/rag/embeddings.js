const { GoogleGenAI } = require('@google/genai');

/**
 * Lazy initializer for GoogleGenAI client using server-side GEMINI_API_KEY
 */
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * Generate embedding vector for a given text input using Gemini text-embedding-004 model
 * @param {string} text - Input text to embed
 * @returns {Promise<number[]>} Embedding vector float array
 */
const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Text input is required to generate vector embeddings.');
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text.trim(),
    });

    if (response && response.embedding && Array.isArray(response.embedding.values)) {
      return response.embedding.values;
    }

    throw new Error('Invalid or empty embedding response returned from Gemini API.');
  } catch (error) {
    console.error('Error in embeddings.generateEmbedding:', error.message);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
};

/**
 * Batch generate embedding vectors for an array of text strings
 * @param {string[]} textArray - Array of input texts
 * @returns {Promise<number[][]>} Array of embedding vector float arrays
 */
const generateBatchEmbeddings = async (textArray) => {
  if (!Array.isArray(textArray) || textArray.length === 0) {
    return [];
  }

  const embeddings = await Promise.all(
    textArray.map((text) => generateEmbedding(text))
  );

  return embeddings;
};

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
};
