const mongoose = require('mongoose');

/**
 * Task Schema
 * Manages cognitive task allocation, status tracking, energy requirements,
 * assignment, and links to decisions or conversations.
 */
const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    linkedDecision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Decision',
      default: null,
    },
    linkedConversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    energyNeeded: {
      type: String,
      enum: ['High Focus', 'Medium Flow', 'Low Energy / Quick'],
      default: 'Medium Flow',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'archived'],
      default: 'todo',
      index: true,
    },
    priorityScore: {
      type: Number,
      min: 1,
      max: 100,
      default: 50,
    },
    dueDate: {
      type: Date,
      required: [true, 'Please specify a task due date'],
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    aiScheduleRecommendation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ user: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Task', TaskSchema);
