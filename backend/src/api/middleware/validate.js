/**
 * Validation Middleware
 * Validates request body against Zod schema
 */

import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Validation Error',
                details: error.errors,
            });
        }
        next(error);
    }
};

export default validate;
