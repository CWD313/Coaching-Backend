import express from 'express';
import {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  permanentlyDeleteStudent,
  assignBatch,
  removeBatch,
  searchStudents,
  getStudentsByBatch,
  getStudentStats
} from '../controllers/studentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { loadTenantFlags } from '../middlewares/tenantFlags.js';
import {
  validateAddStudent,
  validateUpdateStudent,
  validateAssignBatch,
  validateSearch
} from '../middlewares/studentValidationMiddleware.js';

const router = express.Router();

/**
 * All routes require authentication and tenant flags loaded
 */
router.use(authMiddleware);
router.use(loadTenantFlags);

/**
 * Student Management Routes
 */

// POST /api/students - Add new student
router.post('/', validateAddStudent, addStudent);

// GET /api/students - Get all students (with pagination)
router.get('/', getStudents);

// GET /api/students/stats - Get student statistics
router.get('/stats', getStudentStats);

// GET /api/students/search - Search students
router.get('/search', searchStudents);

// GET /api/students/batch/:batchId - Get students in batch
router.get('/batch/:batchId', getStudentsByBatch);

// GET /api/students/:studentId - Get student by ID or studentId
router.get('/:studentId', getStudentById);

// PUT /api/students/:studentId - Update student
router.put('/:studentId', validateUpdateStudent, updateStudent);

// DELETE /api/students/:studentId - Soft delete student (set inactive)
router.delete('/:studentId', deleteStudent);

// DELETE /api/students/:studentId/permanent - Permanently delete student
router.delete('/:studentId/permanent', permanentlyDeleteStudent);

/**
 * Batch Assignment Routes
 */

// POST /api/students/:studentId/batches - Assign batch to student
router.post('/:studentId/batches', validateAssignBatch, assignBatch);

// DELETE /api/students/:studentId/batches/:batchId - Remove batch from student
router.delete('/:studentId/batches/:batchId', removeBatch);

export default router;
