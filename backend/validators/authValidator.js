const { check, validationResult } = require('express-validator');

/**
 * Middleware to check validation result and return 400 with errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * User Registration Validation Rules
 */
const registerValidationRules = [
  check('name')
    .notEmpty()
    .withMessage('Full name is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),

  check('email')
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),

  check('role')
    .optional()
    .isIn(['Admin', 'Executive', 'Engineer', 'Member'])
    .withMessage('Invalid user role specified'),

  check('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
];

/**
 * User Login Validation Rules
 */
const loginValidationRules = [
  check('email')
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  check('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * User Profile Update Validation Rules
 */
const updateProfileValidationRules = [
  check('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),

  check('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
];

module.exports = {
  validate,
  registerValidationRules,
  loginValidationRules,
  updateProfileValidationRules,
};
