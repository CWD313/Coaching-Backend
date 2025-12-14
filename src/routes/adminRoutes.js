import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import loadTenantFlags from '../middlewares/tenantFlags.js';
import adminController from '../controllers/adminController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(loadTenantFlags);

// GET /api/admin/flags
router.get('/flags', adminController.getFlags);

// PUT /api/admin/flags
router.put('/flags', adminController.updateFlags);

export default router;
