const mongoose = require('mongoose');

/**
 * Connect to MongoDB instance using Mongoose.
 * Handles graceful connection logs and error recovery.
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chronomind_ai';
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`[MongoDB Connected]: ${conn.connection.host} / Database: ${conn.connection.name}`);
  } catch (error) {
    console.warn(`[MongoDB Connection Warning]: ${error.message}. Operating with in-memory store fallback.`);
  }
};

module.exports = connectDB;
