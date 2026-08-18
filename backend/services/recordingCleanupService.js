const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

/**
 * Recording Retention & Automatic Cleanup Service
 *
 * Rules:
 * - Default retention = 30 days (or user setting: 7, 30, 90, 0 = Never).
 * - Periodically or on-demand identifies recordings where createdAt + retentionPeriod < now.
 * - Deletes the physical audio file / URL reference.
 * - PRESERVES all extracted structured memories, tasks, decisions, transcript, summary, and RAG index.
 * - Prevents orphan audio files on disk.
 */

/**
 * Delete physical audio file safely from disk
 * @param {string} filePath
 */
const safeDeleteFile = (filePath) => {
  if (!filePath) return false;
  try {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, '..', filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[RecordingCleanup] Safely deleted audio file: ${fullPath}`);
      return true;
    }
  } catch (err) {
    console.warn(`[RecordingCleanup] Failed to delete file ${filePath}:`, err.message);
  }
  return false;
};

/**
 * Clean up expired recordings for all users or a specific user
 * @param {Object} [options]
 * @param {string} [options.userId] - Optional filter for specific user
 * @param {boolean} [options.forceAll] - If true, ignores retention days and purges audio for specified meetings
 */
const cleanExpiredRecordings = async (options = {}) => {
  const now = new Date();
  let deletedCount = 0;
  const deletedIds = [];

  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[RecordingCleanup] MongoDB is not connected. Skipping cleanup check.');
      return { success: true, deletedCount: 0, deletedIds: [], timestamp: now.toISOString() };
    }

    // 1. Fetch user settings cache
    const users = await User.find({}).lean().exec();
    const userSettingsMap = new Map();

    for (const u of users) {
      const retentionDays =
        u.settings?.recordingRetentionDays !== undefined
          ? u.settings.recordingRetentionDays
          : u.settings?.retentionDays !== undefined
          ? u.settings.retentionDays
          : 30; // Default 30 days
      userSettingsMap.set(u._id.toString(), retentionDays);
    }

    // 2. Find all meetings with non-null audio or audioDeleted != true
    const query = {
      $or: [
        { audioUrl: { $ne: null } },
        { audioPath: { $ne: null } },
        { audioDeleted: false },
      ],
    };

    if (options.userId) {
      query.user = options.userId;
    }

    const meetings = await Meeting.find(query).exec();

    for (const meeting of meetings) {
      const userIdStr = meeting.user ? meeting.user.toString() : '';
      const userRetentionDays = userSettingsMap.get(userIdStr) ?? 30;

      // 0 or negative indicates "Never" delete automatically
      if (userRetentionDays <= 0 && !options.forceAll) {
        continue;
      }

      const createdAt = meeting.createdAt || new Date();
      const retentionMs = userRetentionDays * 24 * 60 * 60 * 1000;
      const expirationDate = new Date(createdAt.getTime() + retentionMs);

      const isExpired = now >= expirationDate || options.forceAll;

      if (isExpired && (!meeting.audioDeleted || meeting.audioPath || meeting.audioUrl)) {
        // Delete file on disk if exists
        if (meeting.audioPath) {
          safeDeleteFile(meeting.audioPath);
        }

        // Search uploads folder for any orphan matching meetingId audio files
        const uploadsDir = path.join(__dirname, '../uploads');
        if (fs.existsSync(uploadsDir)) {
          try {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
              if (file.includes(meeting.meetingId) && (file.endsWith('.webm') || file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a'))) {
                safeDeleteFile(path.join(uploadsDir, file));
              }
            }
          } catch (e) {
            // Ignore dir read error
          }
        }

        // Update database document - Preserve all transcript, decisions, tasks, memoryFacts
        meeting.audioUrl = null;
        meeting.audioPath = null;
        meeting.audioDeleted = true;
        meeting.audioDeletedAt = now;

        await meeting.save();

        deletedCount++;
        deletedIds.push(meeting.meetingId);
      }
    }

    console.log(`[RecordingCleanup] Completed check. Purged audio for ${deletedCount} expired recordings.`);
  } catch (err) {
    console.error('[RecordingCleanup] Error during automated recording cleanup:', err.message);
  }

  return {
    success: true,
    deletedCount,
    deletedIds,
    timestamp: now.toISOString(),
  };
};

/**
 * Manually delete recording audio for a single meeting
 * @param {string} meetingId
 * @param {string} userId - User ID for authorization isolation
 */
const deleteSingleRecordingAudio = async (meetingId, userId) => {
  const meeting = await Meeting.findOne({ meetingId, user: userId });

  if (!meeting) {
    throw new Error('Meeting recording not found or access denied.');
  }

  if (meeting.audioPath) {
    safeDeleteFile(meeting.audioPath);
  }

  // Also clean matching files in uploads
  const uploadsDir = path.join(__dirname, '../uploads');
  if (fs.existsSync(uploadsDir)) {
    try {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file.includes(meetingId) && (file.endsWith('.webm') || file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a'))) {
          safeDeleteFile(path.join(uploadsDir, file));
        }
      }
    } catch (e) {}
  }

  // Preserve structured memories, transcript, decisions, tasks
  meeting.audioUrl = null;
  meeting.audioPath = null;
  meeting.audioDeleted = true;
  meeting.audioDeletedAt = new Date();

  await meeting.save();

  return meeting;
};

/**
 * Start automated background scheduler
 */
const startRecordingCleanupScheduler = () => {
  // Run 10 seconds after server startup
  setTimeout(() => {
    cleanExpiredRecordings().catch((err) =>
      console.warn('[RecordingCleanup] Startup run error:', err.message)
    );
  }, 10000);

  // Run every 24 hours
  setInterval(() => {
    cleanExpiredRecordings().catch((err) =>
      console.warn('[RecordingCleanup] Scheduled run error:', err.message)
    );
  }, 24 * 60 * 60 * 1000);
};

module.exports = {
  cleanExpiredRecordings,
  deleteSingleRecordingAudio,
  startRecordingCleanupScheduler,
};
