import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { loadTenantFlags } from '../middlewares/tenantFlags.js';
import exportController from '../controllers/exportController.js';

const router = express.Router();

// GET /api/exports/monthly?batchId=&year=&month=&studentId(optional)
router.get('/monthly', authMiddleware, loadTenantFlags, exportController.exportMonthlyExcel);

export default router;
