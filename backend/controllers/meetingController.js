const Meeting = require('../models/Meeting');
const Decision = require('../models/Decision');
const Task = require('../models/Task');
const geminiService = require('../services/geminiService');
const { storeMemoryFact } = require('../services/memoryFactStore');
const { indexNewMemoryItem, clearRetrievalCache } = require('../rag/ragService');

const {
  cleanExpiredRecordings,
  deleteSingleRecordingAudio,
} = require('../services/recordingCleanupService');

// In-memory fallback list for Meetings if DB is disconnected
const inMemoryMeetings = new Map();

/**
 * Generate unique meeting ID
 */
const generateMeetingId = () => {
  return `mtg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

/**
 * @desc    Analyze meeting transcript and store meeting intelligence
 * @route   POST /api/v1/meetings/analyze
 * @access  Private
 */
const analyzeMeeting = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { transcript, title, source = 'voice', durationSeconds = 0, audioUrl = null, audioPath = null } = req.body;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid meeting transcript in the request body.',
      });
    }

    const cleanTranscript = transcript.trim();

    // 1. Analyze transcript with Gemini AI
    const intelligence = await geminiService.analyzeMeetingIntelligence(cleanTranscript, userId);

    const meetingId = generateMeetingId();
    const meetingTitle = title || intelligence.title || 'Meeting Intelligence Log';

    // 2. Automatically store extracted Memory Facts into memoryFactStore
    if (Array.isArray(intelligence.memoryFacts)) {
      for (const fact of intelligence.memoryFacts) {
        if (fact && fact.key && fact.value) {
          await storeMemoryFact({
            userId,
            category: fact.category || 'personal',
            key: fact.key,
            value: fact.value,
            source,
          });
        }
      }
    }

    // 3. Automatically store extracted decisions into Decision model / store
    if (Array.isArray(intelligence.decisions)) {
      for (const dec of intelligence.decisions) {
        if (dec && dec.title) {
          try {
            await Decision.create({
              user: userId,
              decisionId: `dec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              title: dec.title,
              context: dec.context || cleanTranscript.slice(0, 200),
              status: 'Approved',
              impactScore: dec.impact === 'High' ? 85 : dec.impact === 'Low' ? 40 : 65,
              tags: ['Meeting', intelligence.category || 'General'],
            });
          } catch (dErr) {
            // Ignore if DB save fails
          }
        }
      }
    }

    // 4. Automatically store extracted action items into Task model / store
    if (Array.isArray(intelligence.actionItems)) {
      for (const item of intelligence.actionItems) {
        if (item && item.task) {
          try {
            await Task.create({
              user: userId,
              taskId: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              title: item.task,
              description: `Assigned to: ${item.assignee || 'Team'}. Deadline: ${item.deadline || 'TBD'}. From Meeting: ${meetingTitle}`,
              status: 'Pending',
              priority: item.priority || 'Medium',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
          } catch (tErr) {
            // Ignore if DB save fails
          }
        }
      }
    }

    // 5. Save Meeting to MongoDB (and in-memory fallback)
    let savedMeetingDoc = null;
    try {
      savedMeetingDoc = await Meeting.create({
        user: userId,
        meetingId,
        title: meetingTitle,
        transcript: cleanTranscript,
        summary: intelligence.summary,
        keyPoints: intelligence.keyPoints,
        decisions: intelligence.decisions,
        actionItems: intelligence.actionItems,
        deadlines: intelligence.deadlines,
        peopleMentioned: intelligence.peopleMentioned,
        memoryFacts: intelligence.memoryFacts,
        category: intelligence.category,
        durationSeconds: Number(durationSeconds) || 0,
        audioUrl: audioUrl || (source === 'voice' || source === 'audio' ? `/uploads/meeting_${meetingId}.webm` : null),
        audioPath: audioPath || (source === 'voice' || source === 'audio' ? `uploads/meeting_${meetingId}.webm` : null),
        audioDeleted: false,
      });
    } catch (dbErr) {
      // DB disconnected fallback
      console.warn('[MeetingController] Database save fallback to in-memory store:', dbErr.message);
    }

    const meetingData = savedMeetingDoc ? savedMeetingDoc.toObject() : {
      _id: meetingId,
      user: userId,
      meetingId,
      title: meetingTitle,
      transcript: cleanTranscript,
      summary: intelligence.summary,
      keyPoints: intelligence.keyPoints,
      decisions: intelligence.decisions,
      actionItems: intelligence.actionItems,
      deadlines: intelligence.deadlines,
      peopleMentioned: intelligence.peopleMentioned,
      memoryFacts: intelligence.memoryFacts,
      category: intelligence.category,
      durationSeconds: Number(durationSeconds) || 0,
      audioUrl: audioUrl || (source === 'voice' || source === 'audio' ? `/uploads/meeting_${meetingId}.webm` : null),
      audioPath: audioPath || (source === 'voice' || source === 'audio' ? `uploads/meeting_${meetingId}.webm` : null),
      audioDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryMeetings.set(meetingId, meetingData);

    // 6. Index into Vector Store for RAG Pipeline
    const targetDocId = savedMeetingDoc?._id?.toString() || meetingId;
    await indexNewMemoryItem({
      modelName: 'meeting',
      documentId: targetDocId,
      textContent: `Meeting Title: ${meetingTitle}\nSummary: ${intelligence.summary}\nDecisions: ${JSON.stringify(intelligence.decisions)}\nAction Items: ${JSON.stringify(intelligence.actionItems)}\nDeadlines: ${JSON.stringify(intelligence.deadlines)}\nTranscript: ${cleanTranscript}`,
      extraFields: { user: userId, category: intelligence.category },
    });

    // 7. Clear RAG cache so future queries immediately retrieve this meeting context
    clearRetrievalCache();

    return res.status(200).json({
      success: true,
      message: 'Meeting intelligence processed and indexed successfully',
      data: meetingData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all meeting intelligence records for user
 * @route   GET /api/v1/meetings
 * @access  Private
 */
const getMeetings = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    let dbMeetings = [];

    try {
      dbMeetings = await Meeting.find({ user: userId }).sort({ createdAt: -1 }).lean().exec();
    } catch (dbErr) {
      // DB Fallback
    }

    const combinedMap = new Map();
    if (Array.isArray(dbMeetings)) {
      for (const m of dbMeetings) {
        combinedMap.set(m.meetingId, m);
      }
    }

    for (const m of inMemoryMeetings.values()) {
      if (String(m.user) === String(userId)) {
        if (!combinedMap.has(m.meetingId)) {
          combinedMap.set(m.meetingId, m);
        }
      }
    }

    const meetingsList = Array.from(combinedMap.values());
    meetingsList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return res.status(200).json({
      success: true,
      count: meetingsList.length,
      data: meetingsList,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single meeting intelligence record
 * @route   GET /api/v1/meetings/:id
 * @access  Private
 */
const getMeetingById = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { id } = req.params;

    let meeting = null;
    try {
      meeting = await Meeting.findOne({ meetingId: id, user: userId }).lean().exec();
    } catch (e) {}

    if (!meeting) {
      meeting = inMemoryMeetings.get(id);
    }

    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting record not found.' });
    }

    return res.status(200).json({ success: true, data: meeting });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete meeting record
 * @route   DELETE /api/v1/meetings/:id
 * @access  Private
 */
const deleteMeeting = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { id } = req.params;

    try {
      await Meeting.deleteOne({ meetingId: id, user: userId });
    } catch (e) {}

    inMemoryMeetings.delete(id);
    clearRetrievalCache();

    return res.status(200).json({ success: true, message: 'Meeting record deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Manually delete audio recording for a meeting (preserving transcript, memories, tasks, decisions)
 * @route   DELETE /api/v1/meetings/:id/recording
 * @access  Private (User Isolated)
 */
const deleteMeetingRecording = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { id } = req.params;

    let updatedMeeting = null;
    try {
      updatedMeeting = await deleteSingleRecordingAudio(id, userId);
    } catch (dbErr) {
      // In-memory fallback
      const inMem = inMemoryMeetings.get(id);
      if (inMem && String(inMem.user) === String(userId)) {
        inMem.audioUrl = null;
        inMem.audioPath = null;
        inMem.audioDeleted = true;
        inMem.audioDeletedAt = new Date();
        updatedMeeting = inMem;
      } else {
        return res.status(404).json({
          success: false,
          error: dbErr.message || 'Meeting recording not found or access denied.',
        });
      }
    }

    if (inMemoryMeetings.has(id)) {
      const memItem = inMemoryMeetings.get(id);
      memItem.audioUrl = null;
      memItem.audioPath = null;
      memItem.audioDeleted = true;
      memItem.audioDeletedAt = new Date();
    }

    return res.status(200).json({
      success: true,
      message: 'Audio recording manually deleted. Structured memories, tasks, decisions, and transcript preserved.',
      data: updatedMeeting,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Trigger automatic background cleanup for expired recordings
 * @route   POST /api/v1/meetings/cleanup-recordings
 * @access  Private
 */
const triggerCleanup = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { forceAll } = req.body || {};

    const result = await cleanExpiredRecordings({
      userId,
      forceAll: !!forceAll,
    });

    return res.status(200).json({
      success: true,
      message: 'Automated recording cleanup completed successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  analyzeMeeting,
  getMeetings,
  getMeetingById,
  deleteMeeting,
  deleteMeetingRecording,
  triggerCleanup,
};
