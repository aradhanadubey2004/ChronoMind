const express = require('express');
const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a new action task (manually or AI-extracted)
 * @access  Private
 */
router.post('/', protect, createTask);

/**
 * @route   GET /api/v1/tasks
 * @desc    Get all tasks for the authenticated user (with optional filters: status, priority, conversation, decision)
 * @access  Private
 */
router.get('/', protect, getTasks);

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Get single task details by ID
 * @access  Private
 */
router.get('/:id', protect, getTaskById);

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Update task status, priority, due date, or details
 * @access  Private
 */
router.put('/:id', protect, updateTask);

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete a task securely
 * @access  Private
 */
router.delete('/:id', protect, deleteTask);

module.exports = router;
