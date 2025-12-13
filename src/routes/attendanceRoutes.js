import express from 'express';
import attendanceController from '../controllers/attendanceController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  validateMarkAttendance,
  validateMarkHoliday,
  validateGetDateAttendance,
  validateGetMonthlyAttendance,
  validateGetMonthlyCount,
  validateGetAbsentList,
} from '../middlewares/attendanceValidationMiddleware.js';

const router = express.Router();

// All routes are protected - require authentication
router.use(authMiddleware);

/**
 * POST /api/attendance/mark
 * Mark attendance for multiple students on a specific date
 * Auto-saves on click
 */
router.post('/mark', validateMarkAttendance, attendanceController.markAttendance);

/**
 * POST /api/attendance/holiday
 * Mark entire batch as holiday
 * Sets all students' status to 'holiday'
 */
router.post('/holiday', validateMarkHoliday, attendanceController.markHoliday);

/**
 * GET /api/attendance/date
 * Get attendance for a specific date
 * Paginated to support 8-10 students per screen
 * Query params: batchId, date, page (optional), limit (optional)
 */
router.get('/date', validateGetDateAttendance, attendanceController.getDateAttendance);

/**
 * GET /api/attendance/absent-list
 * Get list of absent students for a specific date
 * Query params: batchId, date, page (optional), limit (optional)
 */
router.get(
  '/absent-list',
  validateGetAbsentList,
  attendanceController.getAbsentStudents
);

/**
 * GET /api/attendance/student/monthly-count
 * Get monthly absent count for a specific student
 * Query params: studentId, year, month
 */
router.get(
  '/student/monthly-count',
  validateGetMonthlyCount,
  attendanceController.getMonthlyAbsentCount
);

/**
 * GET /api/attendance/monthly-report
 * Get monthly report for a batch
 * Includes attendance statistics and low attendance students list
 * Query params: batchId, year, month, page (optional), limit (optional)
 */
router.get(
  '/monthly-report',
  validateGetMonthlyAttendance,
  attendanceController.getMonthlyReport
);

/**
 * GET /api/attendance/range
 * Get attendance records for a date range
 * Query params: batchId, startDate, endDate
 */
router.get('/range', attendanceController.getAttendanceRange);

export default router;
