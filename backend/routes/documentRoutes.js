const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  chatWithDocument,
} = require('../controllers/documentController');

const { protect } = require('../middleware/authMiddleware');

// Configure multer memory storage (limit 15MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
});

/**
 * @route   POST /api/v1/documents/upload
 * @desc    Upload document file, extract text, chunk & embed
 * @access  Private
 */
router.post('/upload', protect, upload.single('file'), uploadDocument);

/**
 * @route   GET /api/v1/documents
 * @desc    Get user documents with optional search filtering
 * @access  Private
 */
router.get('/', protect, getDocuments);

/**
 * @route   GET /api/v1/documents/:id
 * @desc    Get single document details with chunks
 * @access  Private
 */
router.get('/:id', protect, getDocumentById);

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Delete document record
 * @access  Private
 */
router.delete('/:id', protect, deleteDocument);

/**
 * @route   POST /api/v1/documents/chat
 * @desc    Chat with document content
 * @access  Private
 */
router.post('/chat', protect, chatWithDocument);

module.exports = router;
