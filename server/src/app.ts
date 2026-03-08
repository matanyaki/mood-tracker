import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, admin } from './config/firebase';
import journalRoutes from './routes/journalRoutes';
import aiRoutes from './routes/aiRoutes';
import greetingRoutes from './routes/greetingRoutes';
import userRoutes from './routes/userRoutes';
import insightsRoutes from './routes/insightsRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: import('express').NextFunction) => {
    console.log(`[INCOMING] ${req.method} ${req.path}`, req.body);
    next();
});

// API Routes
app.use('/api/entries', journalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/greetings', greetingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/insights', insightsRoutes);

// Health Check Route
app.get('/health', async (req: Request, res: Response) => {
    // Phase 2: Ensure admin.apps.length > 0 to confirm initialization
    // Also checking `db` is already defined in config/firebase.ts if init succeeds
    if (!admin.apps.length || !db) {
        return res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            firebase: {
                status: 'disconnected',
                error: 'Firebase Admin SDK not initialized (service account missing?)'
            },
            message: 'Service Unavailable'
        });
    }

    try {
        // Basic check to see if we can talk to Firestore
        const collections = await db.listCollections();
        const collectionIds = collections.map(col => col.id);

        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            firebase: {
                status: 'connected',
                collections: collectionIds
            },
            message: 'Server is healthy and Firebase is connected.'
        });
    } catch (error: any) {
        console.error('Health Check Failed:', error);
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            firebase: {
                status: 'disconnected',
                error: error.message
            },
            message: 'Service Unavailable'
        });
    }
});

export default app;
