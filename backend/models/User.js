const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User Schema
 * Manages identity, authentication credentials, role RBAC, and AI retention settings.
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Prevents password hash from returning in queries by default
    },
    role: {
      type: String,
      enum: ['Admin', 'Executive', 'Engineer', 'Member'],
      default: 'Executive',
    },
    company: {
      type: String,
      trim: true,
      default: 'ChronoMind Workspace',
    },
    avatar: {
      type: String,
      default: '',
    },
    settings: {
      autoIndexMeetings: {
        type: Boolean,
        default: true,
      },
      retentionDays: {
        type: Number,
        default: 30,
      },
      recordingRetentionDays: {
        type: Number,
        default: 30,
      },
      sensitivityLevel: {
        type: String,
        enum: ['Strict', 'Balanced', 'Relaxed'],
        default: 'Balanced',
      },
      notifications: {
        dailyDigest: { type: Boolean, default: true },
        conflictAlerts: { type: Boolean, default: true },
      },
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare user entered password with hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate Signed JWT Token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_chronomind_2026',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = mongoose.model('User', UserSchema);
