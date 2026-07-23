import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';
import { AppError } from './errorHandler';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email?: string;
            };
        }
    }
}

/**
 * Reads the authenticated uid off the request, or throws 401.
 *
 * Every /api router mounts `authenticateUser` before its handlers, so in practice
 * `req.user` is always populated by the time a controller runs. This narrows the
 * optional type for the compiler and fails loudly if a route is ever mounted
 * without the middleware. The uid is the ONLY accepted source of data ownership —
 * never read an owner id from the body, params, or query.
 */
export const requireUid = (req: Request): string => {
    const uid = req.user?.uid;
    if (!uid) {
        throw new AppError('Unauthorized: No user ID found.', 401);
    }
    return uid;
};

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        console.log(`[AuthMiddleware] Method: ${req.method}, URL: ${req.url}`);
        console.log(`[AuthMiddleware] Headers: Auth=${!!authHeader}`);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'Unauthorized: No token provided'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify the Firebase ID Token
        const decodedToken = await admin.auth().verifyIdToken(token);

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email
        };

        console.log(`[Auth Middleware] Authorized Request for UID:`, decodedToken.uid);

        return next();

    } catch (error: any) {
        console.error('Authentication Error:', error);
        res.status(401).json({
            success: false,
            data: null,
            error: 'Unauthorized: Invalid token'
        });
    }
};
