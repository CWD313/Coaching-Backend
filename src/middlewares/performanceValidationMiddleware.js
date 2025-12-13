import { query, validationResult } from 'express-validator';

export const validatePerformanceQueries = async (req, res, next) => {
  // Basic validation shared across endpoints
  const checks = [];

  // For routes that require studentId optionally, we accept it in query
  checks.push(query('studentId').optional().isMongoId().withMessage('studentId must be a valid id'));
  checks.push(query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('year must be a valid year'));
  checks.push(query('month').optional().isInt({ min: 1, max: 12 }).withMessage('month must be 1-12'));
  checks.push(query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit must be an integer'));
  checks.push(query('page').optional().isInt({ min: 1 }).withMessage('page must be an integer'));
  checks.push(query('q').optional().isString().trim().isLength({ min: 1 }).withMessage('q must be provided when searching'));

  await Promise.all(checks.map((c) => c.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  next();
};

export default validatePerformanceQueries;
