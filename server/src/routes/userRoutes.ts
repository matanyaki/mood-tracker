import express from 'express';
import * as userController from '../controllers/userController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Public route for syncing user (since token might not be ready or could be, but we can secure it by token as well)
// Let's secure it.
router.use(authenticateUser);

router.post('/sync', userController.syncUser);
router.post('/increment-entry', userController.incrementEntryCount);
router.get('/me', userController.getProfile);

export default router;
