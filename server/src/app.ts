import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { admin } from './config/firebase';
import journalRoutes from './routes/journalRoutes';
import greetingRoutes from './routes/greetingRoutes';
import goalRoutes from './routes/goalRoutes';
import userRoutes from './routes/userRoutes';
import insightsRoutes from './routes/insightsRoutes';
import streakRoutes from './routes/streakRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Render (and any similar host) terminates TLS at a load balancer and forwards the
// real client IP in X-Forwarded-For. Without this, express-rate-limit sees every
// request as coming from the proxy's single IP and would throttle the whole world
// against one 600-request budget. Scoped to one hop -- trusting the header blindly
// would let a caller spoof their way around the limiter.
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// Render's health check. Registered before every middleware so probes skip helmet,
// the request logger and the rate limiter. Always 200 and never touches Firestore:
// production refuses to boot without Firebase (config/firebase.ts), so a process
// that is up to answer this is a process that initialized.
app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'OK' });
});

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
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// API Routes
app.use('/api/entries', journalRoutes);
app.use('/api/greetings', greetingRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/streaks', streakRoutes);

// Health Check Route — public and unauthenticated, so the response body must not
// describe internal structure. Diagnostics go to the log, never to the client.
app.get('/health', (_req, res) => {
    const ok = admin.apps.length > 0;
    res.status(ok ? 200 : 503).json({ status: ok ? 'OK' : 'ERROR' });
});

// Central error handler — must stay LAST, after all routes.
app.use(errorHandler);

export default app;
