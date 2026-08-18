const express = require('express');
const router = express.Router();

const {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
} = require('../controllers/conversationController');

const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/conversations
 * @desc    Create a new conversation memory log
 * @access  Private
 */
router.post('/', protect, createConversation);

/**
 * @route   GET /api/v1/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/', protect, getConversations);

/**
 * @route   GET /api/v1/conversations/:id
 * @desc    Get single conversation details by ID
 * @access  Private
 */
router.get('/:id', protect, getConversationById);

/**
 * @route   PUT /api/v1/conversations/:id
 * @desc    Update an existing conversation
 * @access  Private
 */
router.put('/:id', protect, updateConversation);

/**
 * @route   DELETE /api/v1/conversations/:id
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/:id', protect, deleteConversation);

module.exports = router;
