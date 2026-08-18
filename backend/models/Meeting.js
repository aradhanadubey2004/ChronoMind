const mongoose = require('mongoose');

/**
 * Meeting Schema
 * Represents structured meeting intelligence, transcript, extracted decisions,
 * action items, deadlines, participants, and memory facts.
 */
const MeetingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a meeting title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    transcript: {
      type: String,
      required: [true, 'Please provide transcript content'],
    },
    summary: {
      type: String,
      default: '',
    },
    keyPoints: [
      {
        type: String,
        trim: true,
      },
    ],
    decisions: [
      {
        title: { type: String, required: true },
        context: { type: String, default: '' },
        impact: { type: String, default: 'Medium' },
      },
    ],
    actionItems: [
      {
        task: { type: String, required: true },
        assignee: { type: String, default: 'Unassigned' },
        deadline: { type: String, default: 'TBD' },
        priority: { type: String, default: 'Medium' },
      },
    ],
    deadlines: [
      {
        description: { type: String, required: true },
        dateOrTimeframe: { type: String, default: 'Soon' },
        owner: { type: String, default: 'Team' },
      },
    ],
    peopleMentioned: [
      {
        type: String,
        trim: true,
      },
    ],
    memoryFacts: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
        category: { type: String, default: 'personal' },
      },
    ],
    category: {
      type: String,
      enum: ['Architecture', 'Strategy', 'Product', 'Engineering', 'Financial', 'Personal', 'General'],
      default: 'General',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    audioUrl: {
      type: String,
      default: null,
    },
    audioPath: {
      type: String,
      default: null,
    },
    audioDeleted: {
      type: Boolean,
      default: false,
    },
    audioDeletedAt: {
      type: Date,
      default: null,
    },
    vectorEmbedding: {
      type: [Number],
      default: [],
    },
    lastIndexedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
