const Document = require('../models/Document');
const { extractTextFromFile } = require('../services/textExtractionService');
const { processAndEmbedDocument } = require('../services/documentEmbeddingService');
const { indexNewMemoryItem, clearRetrievalCache, orchestrateRAGContext } = require('../rag/ragService');
const { searchVectorStore } = require('../rag/vectorStore');
const { GoogleGenAI } = require('@google/genai');

// In-memory fallback list for documents if DB connection is disconnected
const inMemoryDocuments = new Map();

const generateDocumentId = () => {
  return `doc_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required for document chat.');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Determine file type string
 */
const parseFileType = (filename = '', mimetype = '') => {
  const lowerName = filename.toLowerCase();
  const lowerMime = mimetype.toLowerCase();

  if (lowerName.endsWith('.pdf') || lowerMime.includes('pdf')) return 'pdf';
  if (lowerName.endsWith('.docx') || lowerMime.includes('officedocument')) return 'docx';
  if (lowerName.endsWith('.doc') || lowerMime.includes('word')) return 'doc';
  if (lowerName.endsWith('.txt') || lowerMime.includes('text')) return 'txt';
  return 'other';
};

/**
 * @desc    Upload document file, extract text, chunk, embed & store in RAG memory
 * @route   POST /api/v1/documents/upload
 * @access  Private
 */
const uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';

    let fileBuffer = null;
    let filename = '';
    let mimetype = '';
    let fileSize = 0;

    if (req.file) {
      fileBuffer = req.file.buffer;
      filename = req.file.originalname;
      mimetype = req.file.mimetype;
      fileSize = req.file.size;
    } else if (req.body.fileBase64) {
      // Base64 upload support
      fileBuffer = Buffer.from(req.body.fileBase64, 'base64');
      filename = req.body.filename || 'uploaded_document.txt';
      mimetype = req.body.mimetype || 'text/plain';
      fileSize = fileBuffer.length;
    } else if (req.body.textContent) {
      // Direct raw text input support
      fileBuffer = Buffer.from(req.body.textContent, 'utf-8');
      filename = req.body.filename || 'pasted_text_document.txt';
      mimetype = 'text/plain';
      fileSize = fileBuffer.length;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a valid document file (PDF, TXT, DOC, DOCX).',
      });
    }

    const documentId = generateDocumentId();
    const fileType = parseFileType(filename, mimetype);

    // 1. Text Extraction
    const extractedText = await extractTextFromFile({
      buffer: fileBuffer,
      mimetype,
      filename,
    });

    if (!extractedText || extractedText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Extracted text from file was empty or illegible.',
      });
    }

    // 2. Chunking & Embedding Generation
    const { chunks, docEmbedding, summary } = await processAndEmbedDocument(extractedText);

    // 3. Store in MongoDB / Fallback Store
    let savedDoc = null;
    try {
      savedDoc = await Document.create({
        user: userId,
        documentId,
        filename,
        originalName: filename,
        fileType,
        fileSize,
        textContent: extractedText,
        summary,
        chunks,
        vectorEmbedding: docEmbedding,
        status: 'Indexed',
      });
    } catch (dbErr) {
      console.warn('[DocumentController] MongoDB save fallback to memory store:', dbErr.message);
    }

    const documentData = savedDoc ? savedDoc.toObject() : {
      _id: documentId,
      user: userId,
      documentId,
      filename,
      originalName: filename,
      fileType,
      fileSize,
      textContent: extractedText,
      summary,
      chunks,
      vectorEmbedding: docEmbedding,
      status: 'Indexed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryDocuments.set(documentId, documentData);

    // 4. Index main content and chunks into RAG Vector memory
    await indexNewMemoryItem({
      modelName: 'document',
      documentId,
      textContent: `Document Title: ${filename}\nSummary: ${summary}\nFull Content Excerpt: ${extractedText.slice(0, 2000)}`,
      extraFields: { userId, filename, fileType, isPinned: true },
    });

    // 5. Clear retrieval cache for fresh queries
    clearRetrievalCache();

    return res.status(201).json({
      success: true,
      message: 'Document uploaded, processed, and indexed in vector memory successfully.',
      data: documentData,
    });
  } catch (err) {
    console.error('[DocumentController] Upload error:', err.message);
    return res.status(500).json({
      success: false,
      error: `Document processing failed: ${err.message}`,
    });
  }
};

/**
 * @desc    Get user's uploaded documents
 * @route   GET /api/v1/documents
 * @access  Private
 */
const getDocuments = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const searchQuery = (req.query.search || '').trim().toLowerCase();

    let dbDocs = [];
    try {
      const query = { user: userId };
      dbDocs = await Document.find(query).sort({ createdAt: -1 }).lean().exec();
    } catch (e) {
      // DB fallback
    }

    const combinedMap = new Map();
    if (Array.isArray(dbDocs)) {
      for (const d of dbDocs) {
        combinedMap.set(d.documentId, d);
      }
    }

    for (const d of inMemoryDocuments.values()) {
      if (String(d.user) === String(userId)) {
        if (!combinedMap.has(d.documentId)) {
          combinedMap.set(d.documentId, d);
        }
      }
    }

    let documentsList = Array.from(combinedMap.values());

    if (searchQuery) {
      documentsList = documentsList.filter(
        (doc) =>
          (doc.filename && doc.filename.toLowerCase().includes(searchQuery)) ||
          (doc.textContent && doc.textContent.toLowerCase().includes(searchQuery)) ||
          (doc.summary && doc.summary.toLowerCase().includes(searchQuery))
      );
    }

    documentsList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return res.status(200).json({
      success: true,
      count: documentsList.length,
      data: documentsList,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get document by ID
 * @route   GET /api/v1/documents/:id
 * @access  Private
 */
const getDocumentById = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { id } = req.params;

    let doc = null;
    try {
      doc = await Document.findOne({ documentId: id, user: userId }).lean().exec();
    } catch (e) {}

    if (!doc) {
      doc = inMemoryDocuments.get(id);
    }

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete document
 * @route   DELETE /api/v1/documents/:id
 * @access  Private
 */
const deleteDocument = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { id } = req.params;

    try {
      await Document.deleteOne({ documentId: id, user: userId });
    } catch (e) {}

    inMemoryDocuments.delete(id);
    clearRetrievalCache();

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Chat with document content using RAG retrieval & Gemini
 * @route   POST /api/v1/documents/chat
 * @access  Private
 */
const chatWithDocument = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { message, documentId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid query message.',
      });
    }

    const cleanQuery = message.trim();

    // 1. Fetch document context if documentId is specified
    let targetDocs = [];

    if (documentId) {
      let docObj = null;
      try {
        docObj = await Document.findOne({ documentId, user: userId }).lean().exec();
      } catch (e) {}
      if (!docObj) {
        docObj = inMemoryDocuments.get(documentId);
      }
      if (docObj) {
        targetDocs.push(docObj);
      }
    }

    if (targetDocs.length === 0) {
      // Fetch all documents for this user
      try {
        targetDocs = await Document.find({ user: userId }).lean().exec();
      } catch (e) {}

      if (targetDocs.length === 0) {
        for (const d of inMemoryDocuments.values()) {
          if (String(d.user) === String(userId)) {
            targetDocs.push(d);
          }
        }
      }
    }

    if (targetDocs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No uploaded documents found for chat context. Please upload a document first.',
      });
    }

    // 2. Build document excerpt and chunk context
    let documentContextText = '';
    const relevantChunks = [];

    for (const doc of targetDocs) {
      documentContextText += `DOCUMENT: "${doc.filename}" (Type: ${doc.fileType})\n`;
      documentContextText += `Summary: ${doc.summary || 'N/A'}\n\n`;

      if (Array.isArray(doc.chunks) && doc.chunks.length > 0) {
        // Collect matching chunks or top chunks
        const chunksSample = doc.chunks.slice(0, 10);
        for (const ch of chunksSample) {
          relevantChunks.push({
            filename: doc.filename,
            chunkIndex: ch.chunkIndex,
            text: ch.textContent,
          });
          documentContextText += `[Chunk ${ch.chunkIndex} from ${doc.filename}]:\n${ch.textContent}\n\n`;
        }
      } else {
        documentContextText += `Full Text Excerpt:\n${doc.textContent.slice(0, 4000)}\n\n`;
      }
    }

    // 3. Orchestrate full RAG context from system RAG pipeline
    const ragMeta = await orchestrateRAGContext({
      userId,
      query: cleanQuery,
      options: { basePrompt: documentContextText },
    });

    const ai = getAiClient();

    const systemInstruction = `You are ChronoMind AI Document Intelligence Engine.
You have access to the user's uploaded document(s) and full RAG memory graph.
Answer the user's question accurately using the provided document content and memory context.

DOCUMENT & MEMORY CONTEXT:
${documentContextText}

${ragMeta?.systemInstructionBlock || ''}

INSTRUCTIONS:
- Directly answer the question based on the document content.
- If asked for skills, extract all skills mentioned in the resume or document cleanly.
- If asked for a summary, provide a clear structured summary.
- Be accurate, clear, and professional. Do NOT invent information not present in the document.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: cleanQuery,
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    const aiAnswer = response.text || 'I analyzed your document but could not generate an answer.';

    return res.status(200).json({
      success: true,
      message: 'Document chat response generated successfully.',
      data: {
        userQuery: cleanQuery,
        answer: aiAnswer,
        documentsUsed: targetDocs.map((d) => ({
          documentId: d.documentId,
          filename: d.filename,
          fileType: d.fileType,
        })),
        sourceChunksCount: relevantChunks.length,
      },
    });
  } catch (err) {
    console.error('[DocumentController] Chat error:', err.message);
    return res.status(500).json({
      success: false,
      error: `Document chat failed: ${err.message}`,
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  chatWithDocument,
};
