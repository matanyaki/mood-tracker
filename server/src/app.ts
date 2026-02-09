import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebase';
import journalRoutes from './routes/journalRoutes';
import aiRoutes from './routes/aiRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/entries', journalRoutes);
app.use('/api/ai', aiRoutes);

// Health Check Route
app.get('/health', async (req: Request, res: Response) => {
    // If db is undefined, firebase init failed
    if (!db) {
        return res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            firebase: {
                status: 'disconnected',
                error: 'Firebase service account file not found or invalid'
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
