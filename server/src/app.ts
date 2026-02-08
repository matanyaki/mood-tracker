import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { admin, db } from './config/firebase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
