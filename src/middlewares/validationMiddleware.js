import { body, validationResult } from 'express-validator';

/**
 * Validate signup request
 */
export const validateSignup = [
  body('coachingName')
    .trim()
    .notEmpty()
    .withMessage('Coaching name is required')
    .isLength({ min: 3 })
    .withMessage('Coaching name must be at least 3 characters'),
  
  body('ownerName')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ min: 2 })
    .withMessage('Owner name must be at least 2 characters'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('mobileNumber')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile number must be 10 digits'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('inviteCode')
    .trim()
    .notEmpty()
    .withMessage('Invite code is required'),
  
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
 * Validate login request
 */
export const validateLogin = [
  body('mobileNumber')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile number must be 10 digits'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
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
 * Validate change password request
 */
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
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
