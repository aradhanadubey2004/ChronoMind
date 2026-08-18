const express = require('express');
const router = express.Router();

const {
  generateSummary,
  analyzeDecisions,
  generateTasks,
  generateTemporalChat,
  getMemoryFacts,
  createMemoryFact,
} = require('../controllers/aiController');

const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/ai/summary
 * @desc    Generate structured meeting summary using Gemini AI
 * @access  Private
 */
router.post('/summary', protect, generateSummary);

/**
 * @route   POST /api/v1/ai/decisions
 * @desc    Extract key decisions and options from transcript using Gemini AI
 * @access  Private
 */
router.post('/decisions', protect, analyzeDecisions);

/**
 * @route   POST /api/v1/ai/tasks
 * @desc    Extract actionable tasks and schedule recommendations using Gemini AI
 * @access  Private
 */
router.post('/tasks', protect, generateTasks);

/**
 * @route   POST /api/v1/ai/chat
 * @desc    Generate RAG-augmented temporal chat response
 * @access  Private
 */
router.post('/chat', protect, generateTemporalChat);

/**
 * @route   GET /api/v1/ai/memories
 * @desc    Get active memory facts and history
 * @access  Private
 */
router.get('/memories', protect, getMemoryFacts);

/**
 * @route   POST /api/v1/ai/memories
 * @desc    Create a unique ID memory fact
 * @access  Private
 */
router.post('/memories', protect, createMemoryFact);

module.exports = router;
