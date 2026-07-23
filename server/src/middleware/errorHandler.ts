import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';

/**
 * Error carrying an intended HTTP status. Controllers can `throw new AppError(...)`
 * instead of building an error response by hand.
 */
export class AppError extends Error {
    public readonly status: number;

    constructor(message: string, status = 500) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Service-layer catch helper.
 *
 * An AppError already carries a deliberate status (e.g. 404 for a missing entry);
 * re-wrapping it would downgrade it to an opaque 500, so it is rethrown untouched.
 * Anything else keeps its detail in the server log and surfaces to the client as a
 * generic 500 — never interpolate the original message into the thrown Error, since
 * Firestore messages carry project ids, collection paths and index URLs.
 */
export const rethrow = (error: unknown, context: string): never => {
    if (error instanceof AppError) throw error;
    console.error(`${context}:`, error);
    throw new Error(context);
};

/**
 * Wraps an async handler so rejected promises reach the error handler via next().
 * Lets controllers throw rather than try/catch.
 */
export const asyncWrap = (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};

/**
 * Central error handler. Must be mounted LAST, after all routes.
 */
export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    // If headers are already sent, delegate to Express' default handler.
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            data: null,
            error: 'Validation failed',
            details: err.issues
        });
    }

    if (err instanceof AppError) {
        return res.status(err.status).json({
            success: false,
            data: null,
            error: err.message
        });
    }

    // Unknown error: log the real thing, return an opaque message.
    // Never surface err.message here — it carries Firestore paths, index URLs
    // containing the project ID, and credential details.
    console.error('[ErrorHandler] Unhandled error:', err);
    return res.status(500).json({
        success: false,
        data: null,
        error: 'Internal server error'
    });
};

export default errorHandler;
