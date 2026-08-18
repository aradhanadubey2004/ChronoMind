const express = require('express');
const router = express.Router();

const {
  createChatHistory,
  getChatHistory,
  getChatById,
  updateChatHistory,
  deleteChatHistory,
  pinMemory,
} = require('../controllers/chatController');

const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/chat
 * @desc    Create a new chat history entry / conversation thread
 * @access  Private
 */
router.post('/', protect, createChatHistory);

/**
 * @route   GET /api/v1/chat
 * @desc    Get all chat history threads for authenticated user (supports filters: conversation, isPinned, search, pagination)
 * @access  Private
 */
router.get('/', protect, getChatHistory);

/**
 * @route   GET /api/v1/chat/:id
 * @desc    Get single chat history record & message thread details
 * @access  Private
 */
router.get('/:id', protect, getChatById);

/**
 * @route   PUT /api/v1/chat/:id
 * @desc    Update chat history details (title, append/update messages, pin/favorite status, tags, memory summary)
 * @access  Private
 */
router.put('/:id', protect, updateChatHistory);

/**
 * @route   PUT /api/v1/chat/:id/pin
 * @desc    Pin or unpin chat memory for long-term AI context retrieval
 * @access  Private
 */
router.put('/:id/pin', protect, pinMemory);

/**
 * @route   DELETE /api/v1/chat/:id
 * @desc    Delete chat history thread securely
 * @access  Private
 */
router.delete('/:id', protect, deleteChatHistory);

module.exports = router;
