const ChatHistory = require('../models/ChatHistory');
const Conversation = require('../models/Conversation');

/**
 * @desc    Create a new chat history record (AI prompt & response entry)
 * @route   POST /api/v1/chat
 * @access  Private
 */
const createChatHistory = async (req, res, next) => {
  try {
    const {
      question,
      prompt,
      userMessage,
      answer,
      response,
      aiResponse,
      conversationRef,
      conversation,
      modelUsed,
      memoryContextsRecalled,
      pinnedToMemory,
      feedback,
    } = req.body;

    const queryPrompt = question || prompt || userMessage;
    const aiAnswer = answer || response || aiResponse;

    if (!queryPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a prompt or question for the chat entry',
      });
    }

    if (!aiAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Please provide the AI response answer for the chat entry',
      });
    }

    const convId = conversationRef || conversation || null;

    // Verify conversation ownership if referenced
    if (convId) {
      const conv = await Conversation.findById(convId);
      if (!conv) {
        return res.status(404).json({
          success: false,
          error: 'Referenced conversation memory not found',
        });
      }
      if (conv.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to link chat to this conversation',
        });
      }
    }

    const chat = await ChatHistory.create({
      user: req.user.id,
      question: queryPrompt,
      answer: aiAnswer,
      conversationRef: convId,
      modelUsed: modelUsed || 'gemini-2.5-flash',
      memoryContextsRecalled: Array.isArray(memoryContextsRecalled) ? memoryContextsRecalled : [],
      pinnedToMemory: Boolean(pinnedToMemory),
      feedback: feedback || {},
    });

    res.status(201).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all chat history records for authenticated user
 * @route   GET /api/v1/chat
 * @access  Private
 */
const getChatHistory = async (req, res, next) => {
  try {
    const {
      conversation,
      conversationRef,
      isPinned,
      pinned,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { user: req.user.id };

    const convFilter = conversationRef || conversation;
    if (convFilter) {
      query.conversationRef = convFilter;
    }

    if (isPinned !== undefined || pinned !== undefined) {
      const pinVal = isPinned !== undefined ? isPinned : pinned;
      query.pinnedToMemory = pinVal === 'true' || pinVal === true;
    }

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await ChatHistory.countDocuments(query);

    const chats = await ChatHistory.find(query)
      .populate('conversationRef', 'title category date')
      .sort({ createdTime: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: chats.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: chats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single chat history record by ID
 * @route   GET /api/v1/chat/:id
 * @access  Private
 */
const getChatById = async (req, res, next) => {
  try {
    const chat = await ChatHistory.findById(req.params.id).populate(
      'conversationRef',
      'title transcript category date'
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat history record not found',
      });
    }

    // Verify ownership
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this chat history record',
      });
    }

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update chat history entry details, feedback, or memory status
 * @route   PUT /api/v1/chat/:id
 * @access  Private
 */
const updateChatHistory = async (req, res, next) => {
  try {
    let chat = await ChatHistory.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat history record not found',
      });
    }

    // Verify ownership
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this chat history record',
      });
    }

    const updates = { ...req.body };

    // Handle field aliases
    if (updates.prompt && !updates.question) updates.question = updates.prompt;
    if (updates.response && !updates.answer) updates.answer = updates.response;
    if (updates.pinned !== undefined && updates.pinnedToMemory === undefined) {
      updates.pinnedToMemory = updates.pinned;
    }

    chat = await ChatHistory.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('conversationRef', 'title category date');

    res.status(200).json({
      success: true,
      message: 'Chat history updated successfully',
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a chat history record securely
 * @route   DELETE /api/v1/chat/:id
 * @access  Private
 */
const deleteChatHistory = async (req, res, next) => {
  try {
    const chat = await ChatHistory.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat history record not found',
      });
    }

    // Verify ownership
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this chat history record',
      });
    }

    await chat.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Chat history record removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Pin chat memory for long-term AI context retrieval
 * @route   PUT /api/v1/chat/:id/pin (or via controller logic)
 * @access  Private
 */
const pinMemory = async (req, res, next) => {
  try {
    const chat = await ChatHistory.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat history record not found',
      });
    }

    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify memory pins on this chat',
      });
    }

    const shouldPin = req.body.pinned !== undefined ? req.body.pinned : !chat.pinnedToMemory;

    chat.pinnedToMemory = shouldPin;
    if (req.body.memoryContextsRecalled) {
      chat.memoryContextsRecalled = req.body.memoryContextsRecalled;
    }

    await chat.save();

    res.status(200).json({
      success: true,
      message: shouldPin ? 'Chat context pinned to memory' : 'Chat context unpinned from memory',
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChatHistory,
  getChatHistory,
  getChatById,
  updateChatHistory,
  deleteChatHistory,
  pinMemory,
  // Function aliases for flexible import naming
  createChat: createChatHistory,
  getChats: getChatHistory,
  updateChat: updateChatHistory,
  deleteChat: deleteChatHistory,
};
