// src/middlewares/attendanceValidationMiddleware.js (सुधारा गया)

// ✅ FIX 1: 'require' को 'import' से बदला गया
import { body, query, validationResult } from 'express-validator';

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
      })),
    });
  }
  next();
};

// Validate marking attendance (single or multiple students)
export const validateMarkAttendance = [ // ✅ FIX 2: Export जोड़ा गया
  body('batchId')
    .notEmpty()
    .withMessage('Batch ID is required')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in valid format (YYYY-MM-DD)')
    .custom((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Only allow marking attendance for today or past dates
      if (selectedDate > today) {
        throw new Error('Cannot mark attendance for future dates');
      }
      return true;
    }),
  body('attendance')
    .isArray()
    .withMessage('Attendance must be an array')
    .notEmpty()
    .withMessage('Attendance array cannot be empty')
    .custom((attendance) => {
      if (attendance.length === 0) {
        throw new Error('At least one student record required');
      }

      // Validate each attendance record
      attendance.forEach((record) => {
        if (!record.studentId) {
          throw new Error('Student ID is required for each record');
        }
        if (!record.status) {
          throw new Error('Status is required for each record');
        }
        if (!['present', 'absent', 'holiday'].includes(record.status)) {
          throw new Error(
            `Invalid status "${record.status}". Must be "present", "absent", or "holiday"`
          );
        }
      });
      return true;
    }),
  handleValidationErrors,
];

// Validate marking entire batch as holiday
export const validateMarkHoliday = [ // ✅ FIX 2: Export जोड़ा गया
  body('batchId')
    .notEmpty()
    .withMessage('Batch ID is required')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in valid format (YYYY-MM-DD)'),
  body('holidayReason')
    .optional()
    .isString()
    .withMessage('Holiday reason must be a string')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Holiday reason must not exceed 255 characters'),
  handleValidationErrors,
];

// Validate fetching attendance for a specific date
export const validateGetDateAttendance = [ // ✅ FIX 2: Export जोड़ा गया
  query('batchId')
    .notEmpty()
    .withMessage('Batch ID is required')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in valid format (YYYY-MM-DD)'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors,
];

// Validate fetching monthly attendance
export const validateGetMonthlyAttendance = [ // ✅ FIX 2: Export जोड़ा गया
  query('batchId')
    .notEmpty()
    .withMessage('Batch ID is required')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be valid (2000-2100)'),
  query('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors,
];

// Validate fetching student monthly count
export const validateGetMonthlyCount = [ // ✅ FIX 2: Export जोड़ा गया
  query('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be valid (2000-2100)'),
  query('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  handleValidationErrors,
];

// Validate fetching absent students list
export const validateGetAbsentList = [ // ✅ FIX 2: Export जोड़ा गया
  query('batchId')
    .notEmpty()
    .withMessage('Batch ID is required')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in valid format (YYYY-MM-DD)'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors,
];

// ✅ FIX 3: CommonJS module.exports को हटा दिया गया
