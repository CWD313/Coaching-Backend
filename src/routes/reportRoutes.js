import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { loadTenantFlags } from '../middlewares/tenantFlags.js';
import reportController from '../controllers/reportController.js';

const router = express.Router();

// GET /api/reports/monthly?batchId=&year=&month=&studentId(optional)
router.get('/monthly', authMiddleware, loadTenantFlags, reportController.generateMonthlyReportPDF);

export default router;
