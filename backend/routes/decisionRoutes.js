const express = require('express');
const router = express.Router();

const {
  createDecision,
  getDecisions,
  getDecisionById,
  updateDecision,
  deleteDecision,
} = require('../controllers/decisionController');

const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/decisions
 * @desc    Create a new decision record linked to a conversation memory
 * @access  Private
 */
router.post('/', protect, createDecision);

/**
 * @route   GET /api/v1/decisions
 * @desc    Get all decisions owned by or linked to authenticated user
 * @access  Private
 */
router.get('/', protect, getDecisions);

/**
 * @route   GET /api/v1/decisions/:id
 * @desc    Get single decision details by ID
 * @access  Private
 */
router.get('/:id', protect, getDecisionById);

/**
 * @route   PUT /api/v1/decisions/:id
 * @desc    Update decision status, reasoning, or details
 * @access  Private
 */
router.put('/:id', protect, updateDecision);

/**
 * @route   DELETE /api/v1/decisions/:id
 * @desc    Delete a decision record securely
 * @access  Private
 */
router.delete('/:id', protect, deleteDecision);

module.exports = router;
