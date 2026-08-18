const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const {
  validate,
  registerValidationRules,
  loginValidationRules,
  updateProfileValidationRules,
} = require('../validators/authValidator');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidationRules, validate, register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & get JWT token
 * @access  Public
 */
router.post('/login', loginValidationRules, validate, login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', protect, updateProfileValidationRules, validate, updateProfile);

module.exports = router;
