const mongoose = require('mongoose');

/**
 * Conversation Schema
 * Represents structured indexed transcript memory, vector-ready metadata,
 * notes, tags, and temporal retention metrics.
 */
const ConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a conversation title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    participants: [
      {
        name: { type: String, required: true },
        email: { type: String, default: '' },
        role: { type: String, default: 'Participant' },
      },
    ],
    transcript: {
      type: String,
      required: [true, 'Please provide transcript content or dialogue summary'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Architecture', 'Strategy', 'Product', 'Engineering', 'Financial', 'Personal', 'General'],
      default: 'General',
    },
    retentionScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    decayHorizonDays: {
      type: Number,
      default: 180,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    contextSnippet: {
      type: String,
      default: '',
    },
    sourceSession: {
      type: String,
      default: 'Direct Ingestion',
    },
    // RAG Ready Vector Storage metadata field
    vectorMetadata: {
      embeddingId: { type: String, default: '' },
      indexedChunkCount: { type: Number, default: 0 },
      lastVectorizedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high-performance memory search and temporal filtering
ConversationSchema.index({ user: 1, date: -1 });
ConversationSchema.index({ user: 1, category: 1 });
ConversationSchema.index({ title: 'text', transcript: 'text', tags: 'text' });

module.exports = mongoose.model('Conversation', ConversationSchema);
