import { body, validationResult } from 'express-validator';

/**
 * Validate add/create student request
 */
export const validateAddStudent = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),

  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile number must be 10 digits'),

  body('fatherName')
    .trim()
    .notEmpty()
    .withMessage('Father name is required')
    .isLength({ min: 2 })
    .withMessage('Father name must be at least 2 characters'),

  body('fatherMobileNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Father mobile number must be 10 digits'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),

  body('batchIds')
    .optional()
    .isArray()
    .withMessage('Batch IDs must be an array'),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validate update student request
 */
export const validateUpdateStudent = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),

  body('mobileNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile number must be 10 digits'),

  body('fatherName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Father name must be at least 2 characters'),

  body('fatherMobileNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Father mobile number must be 10 digits'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended'),

  body('batchIds')
    .optional()
    .isArray()
    .withMessage('Batch IDs must be an array'),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validate batch assignment
 */
export const validateAssignBatch = [
  body('batchIds')
    .notEmpty()
    .withMessage('Batch IDs are required')
    .isArray()
    .withMessage('Batch IDs must be an array')
    .notEmpty()
    .withMessage('At least one batch ID is required'),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validate search query
 */
export const validateSearch = [
  body('query')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must not be empty'),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];
