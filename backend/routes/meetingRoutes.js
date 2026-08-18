const express = require('express');
const router = express.Router();

const {
  analyzeMeeting,
  getMeetings,
  getMeetingById,
  deleteMeeting,
  deleteMeetingRecording,
  triggerCleanup,
} = require('../controllers/meetingController');

const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/meetings/cleanup-recordings
 * @desc    Trigger automatic cleanup of expired audio recordings
 * @access  Private
 */
router.post('/cleanup-recordings', protect, triggerCleanup);

/**
 * @route   POST /api/v1/meetings/analyze
 * @desc    Analyze meeting transcript and store meeting intelligence
 * @access  Private
 */
router.post('/analyze', protect, analyzeMeeting);

/**
 * @route   GET /api/v1/meetings
 * @desc    Get all meeting records for user
 * @access  Private
 */
router.get('/', protect, getMeetings);

/**
 * @route   GET /api/v1/meetings/:id
 * @desc    Get single meeting record
 * @access  Private
 */
router.get('/:id', protect, getMeetingById);

/**
 * @route   DELETE /api/v1/meetings/:id/recording
 * @desc    Manually delete audio recording for meeting while preserving transcript & memories
 * @access  Private
 */
router.delete('/:id/recording', protect, deleteMeetingRecording);

/**
 * @route   DELETE /api/v1/meetings/:id
 * @desc    Delete meeting record
 * @access  Private
 */
router.delete('/:id', protect, deleteMeeting);

module.exports = router;
