// src/routes/attendanceRoutes.js (सुधारा गया)

import express from 'express';
import attendanceController from '../controllers/attendanceController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

// ✅ FIX: Named Export को Default Import में बदला गया।
//   अब 'validationMiddleware' में { validateMarkAttendance, ... } ऑब्जेक्ट होगा।
import validationMiddleware from '../middlewares/attendanceValidationMiddleware.js';

const router = express.Router();

// All routes are protected - require authentication
router.use(authMiddleware);

/**
 * POST /api/attendance/mark
 * Mark attendance for multiple students on a specific date
 */
router.post(
  '/mark', 
  // ✅ FIX: इम्पोर्ट किए गए नाम का उपयोग करें
  validationMiddleware.validateMarkAttendance, 
  attendanceController.markAttendance
);

/**
 * POST /api/attendance/holiday
 * Mark entire batch as holiday
 */
router.post(
  '/holiday', 
  // ✅ FIX: इम्पोर्ट किए गए नाम का उपयोग करें
  validationMiddleware.validateMarkHoliday, 
  attendanceController.markHoliday
);

/**
 * GET /api/attendance/date
 * Get attendance for a specific date
 */
router.get(
  '/date', 
  // ✅ FIX: इम्पोर्ट किए गए नाम का उपयोग करें
  validationMiddleware.validateGetDateAttendance, 
  attendanceController.getDateAttendance
);

/**
 * GET /api/attendance/absent-list
 * Get list of absent students for a specific date
 */
router.get(
  '/absent-list',
  // ✅ FIX: इम्पोर्ट किए गए नाम का उपयोग करें
  validationMiddleware.validateGetAbsentList, 
  attendanceController.getAbsentStudents
);

/**
 * GET /api/attendance/student/monthly-count
 * Get monthly absent count for a specific student
 */
router.get(
  '/student/monthly-count',
  // ✅ FIX: इम्पोर्ट किए गए नाम का उपयोग करें
  validationMiddleware.validateGetMonthlyCount, 
  attendanceController.getMonthlyAbsentCount
);

/**
 * GET /api/attendance/monthly-report
 * Get monthly report for a batch
 */
router.get(
  '/monthly-report',
  // ✅ FIX: इम्पोर्ट किए गए नाम का उपयोग करें
  validationMiddleware.validateGetMonthlyAttendance, 
  attendanceController.getMonthlyReport
);

/**
 * GET /api/attendance/range
 * Get attendance records for a date range
 */
router.get('/range', attendanceController.getAttendanceRange);

export default router;
