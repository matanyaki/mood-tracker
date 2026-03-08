import express from 'express';
import * as insightsController from '../controllers/insightsController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all insights routes
router.use(authenticateUser);

// GET /api/insights
router.get('/', insightsController.getInsightsData);

export default router;
