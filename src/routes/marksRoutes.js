import express from 'express';
import * as marksController from '../controllers/marksController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  validateAddTest,
  validateAddMarks,
  validateGetTestHistory,
  validateGetSubjectPerformance,
  validateGetTestById,
  validateBatchTestAnalysis,
  validateSubjectAnalysis,
} from '../middlewares/marksValidationMiddleware.js';

const router = express.Router();

// All routes are protected - require authentication
router.use(authMiddleware);

/**
 * POST /api/marks/test
 * Add a new test
 */
router.post('/test', validateAddTest, marksController.addTest);

/**
 * POST /api/marks/add
 * Add or update marks for a student
 */
router.post('/add', validateAddMarks, marksController.addMarks);

/**
 * GET /api/marks/history
 * Get test history for a student
 * Query params: studentId, page (optional), limit (optional), subject (optional)
 */
router.get('/history', validateGetTestHistory, marksController.getTestHistory);

/**
 * GET /api/marks/subject-performance
 * Get subject-wise performance for a student
 * Query params: studentId, subject
 */
router.get(
  '/subject-performance',
  validateGetSubjectPerformance,
  marksController.getSubjectPerformance
);

/**
 * GET /api/marks/test
 * Get test details with all student results
 * Query params: testId, page (optional), limit (optional)
 */
router.get('/test', validateGetTestById, marksController.getTestById);

/**
 * GET /api/marks/batch-tests
 * Get all tests for a batch
 * Query params: batchId, page (optional), limit (optional)
 */
router.get('/batch-tests', marksController.getBatchTests);

/**
 * GET /api/marks/batch-analysis
 * Get batch test analysis (all students' scores for a test)
 * Query params: batchId, testId, page (optional), limit (optional)
 */
router.get(
  '/batch-analysis',
  validateBatchTestAnalysis,
  marksController.getBatchTestAnalysis
);

/**
 * GET /api/marks/subject-analysis
 * Get subject-wise performance for entire batch
 * Query params: batchId, subject
 */
router.get(
  '/subject-analysis',
  validateSubjectAnalysis,
  marksController.getSubjectAnalysis
);

export default router;
