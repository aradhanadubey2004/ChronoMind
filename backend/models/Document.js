const mongoose = require('mongoose');

const DocumentChunkSchema = new mongoose.Schema({
  chunkIndex: {
    type: Number,
    required: true,
  },
  textContent: {
    type: String,
    required: true,
  },
  vectorEmbedding: {
    type: [Number],
    default: [],
  },
});

const DocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'txt', 'docx', 'doc', 'other'],
      default: 'txt',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    textContent: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    chunks: [DocumentChunkSchema],
    vectorEmbedding: {
      type: [Number],
      default: [],
    },
    status: {
      type: String,
      enum: ['Processing', 'Indexed', 'Failed'],
      default: 'Indexed',
    },
  },
  {
    timestamps: true,
  }
);

// Index for search filtering and vector operations
DocumentSchema.index({ user: 1, filename: 'text', textContent: 'text' });

module.exports = mongoose.model('Document', DocumentSchema);
