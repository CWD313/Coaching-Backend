import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import performanceController from '../controllers/performanceController.js';
import { validatePerformanceQueries } from '../middlewares/performanceValidationMiddleware.js';

const router = express.Router();

// Monthly attendance percentage: ?studentId=&year=&month=
router.get('/attendance-monthly', authMiddleware, validatePerformanceQueries, performanceController.getMonthlyAttendancePercentage);

// Marks vs time: ?studentId=&limit=
router.get('/marks-over-time', authMiddleware, validatePerformanceQueries, performanceController.getMarksOverTime);

// Subject wise marks: ?studentId=
router.get('/subject-wise', authMiddleware, validatePerformanceQueries, performanceController.getSubjectWiseMarks);

// Student search: ?q=&page=&limit=
router.get('/search', authMiddleware, validatePerformanceQueries, performanceController.searchStudents);

export default router;
