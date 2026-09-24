import express from 'express';
import * as goalController from '../controllers/goalController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all goal routes
router.use(authenticateUser);

// GET /api/goals
router.get('/', goalController.getGoals);

// GET /api/goals/completions — every day marked done, keyed by goal.
// Declared ABOVE '/:id': Express matches in order, so the parameterised route
// would otherwise swallow this one and look up a goal named "completions".
router.get('/completions', goalController.getCompletions);

// GET /api/goals/progress?tzOffsetMinutes= — completed / target per goal, over its full run.
// Above '/:id' for the same reason as '/completions'.
router.get('/progress', goalController.getGoalProgress);

// GET /api/goals/:id
router.get('/:id', goalController.getGoal);

// POST /api/goals
router.post('/', goalController.createGoal);

// PUT /api/goals/:id
router.put('/:id', goalController.updateGoal);

// DELETE /api/goals/:id
router.delete('/:id', goalController.deleteGoal);

// POST /api/goals/:id/completions — mark the goal done for one date.
// A POST, not a PUT: the date is the document id, so the server names the resource.
router.post('/:id/completions', goalController.markGoalDone);

export default router;
