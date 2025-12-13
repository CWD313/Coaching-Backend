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

// Validate adding a test
const validateAddTest = [
  body('batchId')
    .notEmpty()
    .withMessage('Batch ID is required')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  body('testName')
    .notEmpty()
    .withMessage('Test name is required')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Test name must be between 3 and 100 characters'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters'),
  body('testDate')
    .notEmpty()
    .withMessage('Test date is required')
    .isISO8601()
    .withMessage('Test date must be in valid format (YYYY-MM-DD)'),
  body('totalMarks')
    .notEmpty()
    .withMessage('Total marks is required')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total marks must be between 1 and 1000'),
  body('passingMarks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Passing marks must be a positive number')
    .custom((passingMarks, { req }) => {
      if (passingMarks && passingMarks > req.body.totalMarks) {
        throw new Error('Passing marks cannot be greater than total marks');
      }
      return true;
    }),
  body('hasNegativeMarking')
    .optional()
    .isBoolean()
    .withMessage('hasNegativeMarking must be a boolean'),
  body('negativeMarkPerWrongAnswer')
    .optional()
    .if(() => body('hasNegativeMarking').run)
    .isFloat({ min: 0 })
    .withMessage('Negative mark must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors,
];

// Validate adding marks for a student
const validateAddMarks = [
  body('testId')
    .notEmpty()
    .withMessage('Test ID is required')
    .isMongoId()
    .withMessage('Invalid test ID'),
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('marksObtained')
    .notEmpty()
    .withMessage('Marks obtained is required')
    .isFloat({ min: 0 })
    .withMessage('Marks must be a non-negative number'),
  body('correctAnswers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Correct answers must be a non-negative integer'),
  body('wrongAnswers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Wrong answers must be a non-negative integer'),
  body('attemptedQuestions')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Attempted questions must be a non-negative integer'),
  body('timeTaken')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time taken must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['passed', 'failed', 'absent'])
    .withMessage('Status must be passed, failed, or absent'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters'),
  handleValidationErrors,
];

// Validate fetching test history
const validateGetTestHistory = [
  query('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('subject')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Subject must not exceed 50 characters'),
  handleValidationErrors,
];

// Validate fetching subject performance
const validateGetSubjectPerformance = [
  query('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  query('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters'),
  handleValidationErrors,
];

// Validate fetching test details
const validateGetTestById = [
  query('testId')
    .notEmpty()
    .withMessage('Test ID is required')
    .isMongoId()
    .withMessage('Invalid test ID'),
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

// Validate batch test analysis
const validateBatchTestAnalysis = [
  query('batchId')
    .notEmpty()
    .withMessage('Batch ID is required')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  query('testId')
    .notEmpty()
    .withMessage('Test ID is required')
    .isMongoId()
    .withMessage('Invalid test ID'),
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

// Validate subject analysis
const validateSubjectAnalysis = [
  query('batchId')
    .notEmpty()
    .withMessage('Batch ID is required')
    .isMongoId()
    .withMessage('Invalid batch ID'),
  query('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters'),
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

export {
  validateAddTest,
  validateAddMarks,
  validateGetTestHistory,
  validateGetSubjectPerformance,
  validateGetTestById,
  validateBatchTestAnalysis,
  validateSubjectAnalysis,
};
