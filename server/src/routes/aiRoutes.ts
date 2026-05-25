import express from 'express';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware
router.use(authenticateUser);

export default router;
