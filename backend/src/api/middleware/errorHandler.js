/**
 * Error Handling Middleware
 * Centralized error handler for Express
 */

import logger from '../../utils/logger.js';
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('API Error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.errors,
        });
    }

    // Handle specific error types
    if (err.message.includes('not found')) {
        return res.status(404).json({
            error: 'Not Found',
            message: err.message,
        });
    }

    if (err.message.includes('unauthorized') || err.message.includes('forbidden')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: err.message,
        });
    }

    // Default server error
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    });
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
    errorHandler,
    asyncHandler,
};
