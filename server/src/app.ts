import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { db, admin } from './config/firebase';
import journalRoutes from './routes/journalRoutes';
import greetingRoutes from './routes/greetingRoutes';
import userRoutes from './routes/userRoutes';
import insightsRoutes from './routes/insightsRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: import('express').NextFunction) => {
    console.log(`[INCOMING] ${req.method} ${req.path}`);
    next();
});

// Rate limiting — applied to /api only, so /health stays pollable.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// API Routes
app.use('/api/entries', journalRoutes);
app.use('/api/greetings', greetingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/insights', insightsRoutes);

// Health Check Route — public and unauthenticated, so the response body must not
// describe internal structure. Diagnostics go to the log, never to the client.
app.get('/health', async (_req: Request, res: Response) => {
    if (!admin.apps.length || !db) {
        console.error('[Health] Firebase Admin SDK not initialized (service account missing?)');
        return res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            firebase: 'disconnected'
        });
    }

    try {
        // Liveness probe: confirms we can actually reach Firestore. The result is
        // deliberately discarded — collection IDs are not the caller's business.
        await db.listCollections();

        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            firebase: 'connected'
        });
    } catch (error) {
        console.error('[Health] Firestore check failed:', error);
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            firebase: 'disconnected'
        });
    }
});

// Central error handler — must stay LAST, after all routes.
app.use(errorHandler);

export default app;
