import express from 'express';
import * as journalController from '../controllers/journalController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all journal routes
router.use(authenticateUser);

// GET /api/entries/stats
router.get('/stats', async (req, res, next) => {
    try {
        const { getEmotionStats } = await import('../controllers/insightsController');
        await getEmotionStats(req, res);
    } catch (e) {
        next(e);
    }
});

// GET /api/entries
router.get('/', journalController.getEntries);

// POST /api/entries
router.post('/', journalController.createEntry);

// PUT /api/entries/:id
router.put('/:id', journalController.updateEntry);

// DELETE /api/entries/:id
router.delete('/:id', journalController.deleteEntry);

export default router;
