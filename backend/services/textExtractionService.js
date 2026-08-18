const pdfParse = require('pdf-parse');

/**
 * Text Extraction Service for ChronoMind AI Document Memory
 * Supports PDF, TXT, DOC, DOCX files
 */

/**
 * Clean and normalize extracted text string
 * @param {string} rawText 
 * @returns {string}
 */
const sanitizeText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Extract plain text from PDF buffer using pdf-parse
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const extractFromPDF = async (buffer) => {
  try {
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text || '';
    return sanitizeText(text);
  } catch (error) {
    console.warn('[TextExtractionService] PDF parsing fallback:', error.message);
    // Fallback buffer toString clean extraction
    const rawStr = buffer.toString('utf-8');
    // Filter out binary control chars
    const printable = rawStr.replace(/[^\x20-\x7E\n\t]/g, ' ');
    return sanitizeText(printable);
  }
};

/**
 * Extract text from DOC/DOCX buffer or text string
 * @param {Buffer} buffer 
 * @returns {string}
 */
const extractFromDOCX = (buffer) => {
  try {
    const rawStr = buffer.toString('utf-8');
    // Extract readable XML content or text tokens between tags
    const cleanText = rawStr
      .replace(/<[^>]+>/g, ' ')
      .replace(/[^\x20-\x7E\n\t]/g, ' ');
    return sanitizeText(cleanText);
  } catch (error) {
    console.warn('[TextExtractionService] DOCX extraction error:', error.message);
    return sanitizeText(buffer.toString('utf-8'));
  }
};

/**
 * Extract text from uploaded file buffer based on mimetype and extension
 * @param {Object} params
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.mimetype - File MIME type
 * @param {string} params.filename - Original filename
 * @returns {Promise<string>}
 */
const extractTextFromFile = async ({ buffer, mimetype, filename = '' }) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Valid file buffer is required for text extraction.');
  }

  const lowerFilename = filename.toLowerCase();
  const lowerMime = (mimetype || '').toLowerCase();

  // 1. PDF
  if (lowerMime.includes('pdf') || lowerFilename.endsWith('.pdf')) {
    const pdfText = await extractFromPDF(buffer);
    if (pdfText && pdfText.length > 20) {
      return pdfText;
    }
  }

  // 2. DOC / DOCX
  if (
    lowerMime.includes('word') ||
    lowerMime.includes('officedocument') ||
    lowerFilename.endsWith('.docx') ||
    lowerFilename.endsWith('.doc')
  ) {
    const docxText = extractFromDOCX(buffer);
    if (docxText && docxText.length > 20) {
      return docxText;
    }
  }

  // 3. Plain Text / TXT / Markdown / Code / Default Fallback
  const utf8Text = buffer.toString('utf-8');
  const sanitized = sanitizeText(utf8Text);

  if (!sanitized) {
    throw new Error('Could not extract legible text from document.');
  }

  return sanitized;
};

module.exports = {
  extractTextFromFile,
  sanitizeText,
};
