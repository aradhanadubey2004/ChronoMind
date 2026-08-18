const mongoose = require('mongoose');

/**
 * MemoryFact Schema
 * Represents structured extracted personal facts with unique memoryId,
 * active/inactive status tracking, history retention, and vector reference.
 */
const MemoryFactSchema = new mongoose.Schema(
  {
    memoryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: 'personal',
      enum: ['personal', 'education', 'work', 'location', 'goals', 'preferences', 'tasks', 'general'],
      index: true,
    },
    key: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      default: 'voice',
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    vectorEmbedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

MemoryFactSchema.index({ userId: 1, key: 1, status: 1 });
MemoryFactSchema.index({ userId: 1, category: 1, status: 1 });

module.exports = mongoose.models.MemoryFact || mongoose.model('MemoryFact', MemoryFactSchema);
