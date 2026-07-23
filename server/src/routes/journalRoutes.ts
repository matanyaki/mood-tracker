import express from 'express';
import * as journalController from '../controllers/journalController';
import * as insightsController from '../controllers/insightsController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all journal routes
router.use(authenticateUser);

// GET /api/entries/stats — must stay above any '/:id' route.
router.get('/stats', insightsController.getEmotionStats);

// GET /api/entries
router.get('/', journalController.getEntries);

// POST /api/entries
router.post('/', journalController.createEntry);

// PUT /api/entries/:id
router.put('/:id', journalController.updateEntry);

// DELETE /api/entries/:id
router.delete('/:id', journalController.deleteEntry);

export default router;
