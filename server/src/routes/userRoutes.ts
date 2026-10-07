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
router.patch('/me', userController.updateProfile);
// Wipes entries, greetings and goals; the account and profile stay.
router.delete('/me/data', userController.deleteAllData);
// Wipes everything, profile included, and deletes the Firebase Auth account.
router.delete('/me', userController.deleteAccount);

export default router;
