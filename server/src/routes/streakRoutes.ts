import express from 'express';
import * as streakController from '../controllers/streakController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all streak routes
router.use(authenticateUser);

// GET /api/streaks
router.get('/', streakController.getStreaks);

export default router;
