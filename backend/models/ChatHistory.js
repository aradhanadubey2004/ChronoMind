const mongoose = require('mongoose');

/**
 * ChatHistory Schema
 * Logs AI assistant queries, generated responses, source conversation context references,
 * used AI model details, and feedback metrics.
 */
const ChatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Please provide a chat prompt or question'],
    },
    answer: {
      type: String,
      required: [true, 'Please provide the AI response answer'],
    },
    conversationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    modelUsed: {
      type: String,
      default: 'gemini-2.5-flash',
    },
    memoryContextsRecalled: [
      {
        type: String,
      },
    ],
    pinnedToMemory: {
      type: Boolean,
      default: false,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5, default: null },
      isHelpful: { type: Boolean, default: null },
      comment: { type: String, default: '' },
    },
    createdTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ChatHistorySchema.index({ user: 1, createdTime: -1 });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
