
import { Router } from 'express';
import * as greetingController from '../controllers/greetingController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Apply auth middleware if strictly needed, or allow passing userId in body for now if auth is loose
// Given app.ts has auth middleware, let's try to use it or match journalRoutes
router.use(authenticateUser);

router.post('/', greetingController.createGreeting);
router.get('/', greetingController.getGreetings);

export default router;
