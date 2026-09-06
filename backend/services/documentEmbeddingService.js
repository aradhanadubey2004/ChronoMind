const { generateEmbedding, generateBatchEmbeddings } = require('../rag/embeddingService');
const { GoogleGenAI } = require('@google/genai');

/**
 * Document Embedding & Chunking Service for ChronoMind AI
 */

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

/**
 * Split text into semantic overlapping chunks (~600 chars, ~100 char overlap)
 * @param {string} fullText 
 * @param {number} [chunkSize=600] 
 * @param {number} [overlap=100] 
 * @returns {string[]} Array of text chunks
 */
const chunkTextContent = (fullText, chunkSize = 600, overlap = 100) => {
  if (!fullText || typeof fullText !== 'string') return [];

  const text = fullText.trim();
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < text.length) {
      // Find a clean sentence or paragraph boundary near endIndex
      const boundaryIndex = text.lastIndexOf('\n', endIndex);
      const spaceIndex = text.lastIndexOf(' ', endIndex);

      if (boundaryIndex > startIndex + chunkSize * 0.5) {
        endIndex = boundaryIndex + 1;
      } else if (spaceIndex > startIndex + chunkSize * 0.5) {
        endIndex = spaceIndex + 1;
      }
    } else {
      endIndex = text.length;
    }

    const chunkStr = text.slice(startIndex, endIndex).trim();
    if (chunkStr.length > 10) {
      chunks.push(chunkStr);
    }

    if (endIndex >= text.length) break;
    startIndex = endIndex - overlap;
  }

  return chunks;
};

/**
 * Process document text: Chunk, Batch Embed, Summarize
 * @param {string} textContent 
 * @returns {Promise<{ chunks: Array, docEmbedding: number[], summary: string }>}
 */
const processAndEmbedDocument = async (textContent) => {
  if (!textContent || typeof textContent !== 'string' || !textContent.trim()) {
    throw new Error('No valid text content found in document to process.');
  }

  const cleanText = textContent.trim();

  // 1. Chunk document text
  const rawChunks = chunkTextContent(cleanText, 700, 120);

  // 2. Generate batch embeddings for all chunks concurrently
  const chunkEmbeddings = await generateBatchEmbeddings(rawChunks);

  const chunks = rawChunks.map((chunkStr, idx) => ({
    chunkIndex: idx,
    textContent: chunkStr,
    vectorEmbedding: chunkEmbeddings[idx] || [],
  }));

  // 3. Generate main document vector embedding
  const docEmbedding = await generateEmbedding(cleanText.slice(0, 4000));

  // 4. Auto-generate executive document summary using Gemini API
  let summary = '';
  try {
    const ai = getAiClient();
    if (ai) {
      const resp = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Provide a concise 2-sentence executive summary of the following document content:\n\n${cleanText.slice(0, 3000)}`,
        config: {
          temperature: 0.2,
          maxOutputTokens: 250,
        },
      });
      if (resp && resp.text) {
        summary = resp.text.trim();
      }
    }
  } catch (err) {
    console.warn('[DocumentEmbeddingService] Gemini summary generation skipped:', err.message);
  }

  if (!summary) {
    // Fallback summary snippet
    summary = cleanText.length > 250 ? cleanText.slice(0, 247) + '...' : cleanText;
  }

  return {
    chunks,
    docEmbedding,
    summary,
  };
};

module.exports = {
  chunkTextContent,
  processAndEmbedDocument,
};
