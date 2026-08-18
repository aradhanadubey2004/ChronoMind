const Conversation = require('../models/Conversation');

/**
 * @desc    Create a new conversation memory entry
 * @route   POST /api/v1/conversations
 * @access  Private
 */
const createConversation = async (req, res, next) => {
  try {
    const {
      title,
      transcript,
      participants,
      date,
      tags,
      notes,
      category,
      retentionScore,
      decayHorizonDays,
      isPinned,
      contextSnippet,
      sourceSession,
      vectorMetadata,
    } = req.body;

    if (!title || !transcript) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both title and transcript content',
      });
    }

    const conversation = await Conversation.create({
      user: req.user.id,
      title,
      transcript,
      participants: participants || [],
      date: date || new Date(),
      tags: tags || [],
      notes: notes || '',
      category: category || 'Architecture',
      retentionScore: retentionScore !== undefined ? retentionScore : 85,
      decayHorizonDays: decayHorizonDays || 180,
      isPinned: isPinned || false,
      contextSnippet: contextSnippet || (transcript ? transcript.substring(0, 180) + '...' : ''),
      sourceSession: sourceSession || 'Direct Ingestion',
      vectorMetadata: vectorMetadata || { embeddingId: '', indexedChunkCount: 0 },
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all conversations for the logged in user (with optional search, category filter, pagination)
 * @route   GET /api/v1/conversations
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const { category, tag, search, isPinned, page = 1, limit = 20 } = req.query;

    const query = { user: req.user.id };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (isPinned !== undefined) {
      query.isPinned = isPinned === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { transcript: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Conversation.countDocuments(query);

    const conversations = await Conversation.find(query)
      .sort({ isPinned: -1, date: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single conversation memory detail
 * @route   GET /api/v1/conversations/:id
 * @access  Private
 */
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation memory not found',
      });
    }

    // Verify ownership
    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this conversation memory',
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update conversation memory log
 * @route   PUT /api/v1/conversations/:id
 * @access  Private
 */
const updateConversation = async (req, res, next) => {
  try {
    let conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation memory not found',
      });
    }

    // Verify ownership
    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this conversation memory',
      });
    }

    conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation memory updated successfully',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete conversation memory log
 * @route   DELETE /api/v1/conversations/:id
 * @access  Private
 */
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation memory not found',
      });
    }

    // Verify ownership
    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this conversation memory',
      });
    }

    await conversation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Conversation memory removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
};
