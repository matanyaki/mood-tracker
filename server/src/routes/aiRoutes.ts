import express from 'express';
import * as aiController from '../controllers/aiController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware
router.use(authenticateUser);

// POST /api/ai/reflect
router.post('/reflect', aiController.generateReflection);

export default router;
