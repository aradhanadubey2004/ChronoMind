const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Initialize Express application
const app = express();

// Trust proxy for Cloud Run / Nginx reverse proxies
app.set('trust proxy', 1);

// 1. Security Middleware Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: false,
  })
);

// 2. CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// 3. Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/', limiter);

// 4. Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Static Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5b. Serve Frontend Static Production Build if present
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// 6. Base Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ChronoMind AI Backend Engine Operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Route Mounts
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/conversations', require('./routes/conversationRoutes'));
app.use('/api/v1/decisions', require('./routes/decisionRoutes'));
app.use('/api/v1/tasks', require('./routes/taskRoutes'));
app.use('/api/v1/chat', require('./routes/chatRoutes'));
app.use('/api/v1/ai', require('./routes/aiRoutes'));
app.use('/api/v1/meetings', require('./routes/meetingRoutes'));
app.use('/api/v1/documents', require('./routes/documentRoutes'));

// 7. Non-API SPA Fallback & 404 Handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({
      success: false,
      error: `Resource not found - ${req.originalUrl}`,
    });
  }

  // If frontend production build exists, serve index.html for SPA routing
  const fs = require('fs');
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }

  // In development, pass non-API requests to Vite dev server middleware
  next();
});

// 8. Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Unhandled Error]: ${err.stack || err.message}`);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
