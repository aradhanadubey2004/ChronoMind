const Decision = require('../models/Decision');
const Conversation = require('../models/Conversation');

/**
 * @desc    Create a new decision log linked with a conversation or workspace context
 * @route   POST /api/v1/decisions
 * @access  Private
 */
const createDecision = async (req, res, next) => {
  try {
    const {
      title,
      description,
      conversation,
      status,
      impactScore,
      riskLevel,
      choices,
      author,
      tags,
      simulationCount,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both title and description for the decision',
      });
    }

    // If conversation ID is provided, verify conversation existence and ownership
    if (conversation) {
      const conv = await Conversation.findById(conversation);
      if (!conv) {
        return res.status(404).json({
          success: false,
          error: 'Referenced conversation memory not found',
        });
      }
      if (conv.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to link a decision to this conversation',
        });
      }
    }

    const decision = await Decision.create({
      user: req.user.id,
      conversation: conversation || null,
      title,
      description,
      status: status || 'Evaluating',
      impactScore: impactScore !== undefined ? impactScore : 5,
      riskLevel: riskLevel || 'Medium',
      choices: choices || [],
      author: author || req.user.name || 'Executive Committee',
      tags: tags || [],
      simulationCount: simulationCount || 0,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      data: decision,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all decisions owned by authenticated user
 * @route   GET /api/v1/decisions
 * @access  Private
 */
const getDecisions = async (req, res, next) => {
  try {
    const { status, riskLevel, conversation, search, page = 1, limit = 20 } = req.query;

    const query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    if (conversation) {
      query.conversation = conversation;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Decision.countDocuments(query);

    const decisions = await Decision.find(query)
      .populate('conversation', 'title category date')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: decisions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: decisions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single decision details by ID
 * @route   GET /api/v1/decisions/:id
 * @access  Private
 */
const getDecisionById = async (req, res, next) => {
  try {
    const decision = await Decision.findById(req.params.id).populate(
      'conversation',
      'title transcript category date participants'
    );

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision record not found',
      });
    }

    // Verify ownership
    if (decision.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this decision record',
      });
    }

    res.status(200).json({
      success: true,
      data: decision,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update decision status, reasoning, or choices
 * @route   PUT /api/v1/decisions/:id
 * @access  Private
 */
const updateDecision = async (req, res, next) => {
  try {
    let decision = await Decision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision record not found',
      });
    }

    // Verify ownership
    if (decision.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this decision record',
      });
    }

    decision = await Decision.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('conversation', 'title category date');

    res.status(200).json({
      success: true,
      message: 'Decision updated successfully',
      data: decision,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a decision record securely
 * @route   DELETE /api/v1/decisions/:id
 * @access  Private
 */
const deleteDecision = async (req, res, next) => {
  try {
    const decision = await Decision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision record not found',
      });
    }

    // Verify ownership
    if (decision.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this decision record',
      });
    }

    await decision.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Decision record removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDecision,
  getDecisions,
  getDecisionById,
  updateDecision,
  deleteDecision,
};
