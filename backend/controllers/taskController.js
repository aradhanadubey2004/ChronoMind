const Task = require('../models/Task');
const Conversation = require('../models/Conversation');
const Decision = require('../models/Decision');

/**
 * Helper to normalize incoming status string to Schema Enum values
 */
const normalizeStatus = (statusStr) => {
  if (!statusStr) return undefined;
  const s = statusStr.toLowerCase().trim();
  if (s === 'pending' || s === 'todo') return 'todo';
  if (s === 'in-progress' || s === 'in_progress' || s === 'inprogress') return 'in_progress';
  if (s === 'completed' || s === 'done') return 'completed';
  if (s === 'archived') return 'archived';
  return statusStr;
};

/**
 * @desc    Create a new action task (manually or AI-extracted)
 * @route   POST /api/v1/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      status,
      priorityScore,
      priority,
      energyNeeded,
      dueDate,
      deadline,
      assignedTo,
      linkedConversation,
      conversation,
      linkedDecision,
      decision,
      aiScheduleRecommendation,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a task title',
      });
    }

    const conversationId = linkedConversation || conversation || null;
    const decisionId = linkedDecision || decision || null;

    // Verify conversation ownership if linked
    if (conversationId) {
      const conv = await Conversation.findById(conversationId);
      if (!conv) {
        return res.status(404).json({
          success: false,
          error: 'Referenced conversation memory not found',
        });
      }
      if (conv.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to link a task to this conversation',
        });
      }
    }

    // Verify decision ownership if linked
    if (decisionId) {
      const dec = await Decision.findById(decisionId);
      if (!dec) {
        return res.status(404).json({
          success: false,
          error: 'Referenced decision record not found',
        });
      }
      if (dec.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to link a task to this decision',
        });
      }
    }

    const taskStatus = normalizeStatus(status) || 'todo';
    const taskDueDate = dueDate || deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days from now

    // Determine priority score (accept priorityScore or map priority label string/number)
    let finalPriorityScore = 50;
    if (priorityScore !== undefined) {
      finalPriorityScore = parseInt(priorityScore, 10) || 50;
    } else if (priority) {
      if (typeof priority === 'number') {
        finalPriorityScore = priority;
      } else if (typeof priority === 'string') {
        const p = priority.toLowerCase();
        if (p === 'high' || p === 'urgent') finalPriorityScore = 85;
        else if (p === 'medium') finalPriorityScore = 50;
        else if (p === 'low') finalPriorityScore = 20;
      }
    }

    const task = await Task.create({
      user: req.user.id,
      assignedTo: assignedTo || req.user.id,
      linkedConversation: conversationId,
      linkedDecision: decisionId,
      title,
      description: description || '',
      energyNeeded: energyNeeded || 'Medium Flow',
      status: taskStatus,
      priorityScore: finalPriorityScore,
      dueDate: taskDueDate,
      completedAt: taskStatus === 'completed' ? new Date() : null,
      aiScheduleRecommendation: aiScheduleRecommendation || '',
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tasks for authenticated user with optional filters & pagination
 * @route   GET /api/v1/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      conversation,
      linkedConversation,
      decision,
      linkedDecision,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { user: req.user.id };

    if (status) {
      query.status = normalizeStatus(status);
    }

    const conversationFilter = linkedConversation || conversation;
    if (conversationFilter) {
      query.linkedConversation = conversationFilter;
    }

    const decisionFilter = linkedDecision || decision;
    if (decisionFilter) {
      query.linkedDecision = decisionFilter;
    }

    if (priority) {
      const p = priority.toString().toLowerCase();
      if (p === 'high') query.priorityScore = { $gte: 70 };
      else if (p === 'medium') query.priorityScore = { $gte: 40, $lt: 70 };
      else if (p === 'low') query.priorityScore = { $lt: 40 };
      else if (!isNaN(parseInt(p, 10))) query.priorityScore = parseInt(p, 10);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate('linkedConversation', 'title category date')
      .populate('linkedDecision', 'title status riskLevel')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task details by ID
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('linkedConversation', 'title transcript category date')
      .populate('linkedDecision', 'title description status impactScore riskLevel');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task record not found',
      });
    }

    // Verify ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this task record',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task information, status, priority, or due date
 * @route   PUT /api/v1/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task record not found',
      });
    }

    // Verify ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this task record',
      });
    }

    const updates = { ...req.body };

    // Handle status normalization and completion timestamp
    if (updates.status) {
      const normStatus = normalizeStatus(updates.status);
      updates.status = normStatus;
      if (normStatus === 'completed' && task.status !== 'completed') {
        updates.completedAt = new Date();
      } else if (normStatus !== 'completed' && task.status === 'completed') {
        updates.completedAt = null;
      }
    }

    // Handle deadline/dueDate alias
    if (updates.deadline && !updates.dueDate) {
      updates.dueDate = updates.deadline;
    }

    // Handle priority aliases
    if (updates.priority && updates.priorityScore === undefined) {
      if (typeof updates.priority === 'number') {
        updates.priorityScore = updates.priority;
      } else if (typeof updates.priority === 'string') {
        const p = updates.priority.toLowerCase();
        if (p === 'high' || p === 'urgent') updates.priorityScore = 85;
        else if (p === 'medium') updates.priorityScore = 50;
        else if (p === 'low') updates.priorityScore = 20;
      }
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('linkedConversation', 'title category date')
      .populate('linkedDecision', 'title status riskLevel');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task record securely
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task record not found',
      });
    }

    // Verify ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this task record',
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
