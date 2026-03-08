import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';

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
