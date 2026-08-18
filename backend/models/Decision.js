const mongoose = require('mongoose');

/**
 * Decision Schema
 * Tracks corporate choices, risk indexes, multi-branch simulation outcomes,
 * and temporal links to originating conversations.
 */
const DecisionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Please provide a decision title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a decision description or background'],
    },
    status: {
      type: String,
      enum: ['Executed', 'Evaluating', 'Simulated', 'Archived'],
      default: 'Evaluating',
      index: true,
    },
    impactScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    choices: [
      {
        label: { type: String, required: true },
        selected: { type: Boolean, default: false },
        aiConfidence: { type: Number, min: 0, max: 100, default: 80 },
        projectedOutcome: { type: String, default: '' },
        riskIndex: { type: Number, min: 0, max: 100, default: 20 },
      },
    ],
    author: {
      type: String,
      required: true,
      default: 'Executive Committee',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    simulationCount: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

DecisionSchema.index({ user: 1, status: 1 });
DecisionSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('Decision', DecisionSchema);
