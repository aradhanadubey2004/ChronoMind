const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Protect Routes - Verifies Bearer JWT Token in Authorization Header
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Token missing.',
    });
  }

  try {
    // Verify Token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_chronomind_2026'
    );

    let user = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.id);
      } catch (dbErr) {
        console.warn('[Auth Middleware DB Lookup Warning]:', dbErr.message);
      }
    }

    if (!user) {
      // Fallback user object if DB is offline or user document not found
      user = {
        _id: decoded.id || '65c2a1234567890abcdef123',
        id: decoded.id || '65c2a1234567890abcdef123',
        name: decoded.name || 'Alex Vance',
        email: decoded.email || 'alex.vance@quantumtech.io',
        role: decoded.role || 'Executive',
        company: 'Quantum Tech',
      };
    }

    // Attach user document to request object
    req.user = user;
    next();
  } catch (error) {
    console.error(`[Auth Middleware Error]: ${error.message}`);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Token invalid or expired.',
    });
  }
};

/**
 * Role-Based Authorization Middleware (RBAC)
 * @param  {...string} roles Allowed roles (e.g., 'Admin', 'Executive')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this resource. Required roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
