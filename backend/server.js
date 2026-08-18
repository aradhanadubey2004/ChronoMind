const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env or .env.example
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');
const { startRecordingCleanupScheduler } = require('./services/recordingCleanupService');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Start Recording Retention Cleanup Scheduler
startRecordingCleanupScheduler();

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  ChronoMind AI Backend Server Listening on Port ${PORT}`);
  console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`[Unhandled Rejection Error]: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception Error]: ${err.message}`);
  process.exit(1);
});
