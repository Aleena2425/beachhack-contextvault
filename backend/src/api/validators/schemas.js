/**
 * Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

// Customer schemas
export const customerSchemas = {
    identify: z.object({
        external_id: z.string().min(1),
        name: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        metadata: z.record(z.any()).optional(),
    }),

    update: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        preferences: z.record(z.any()).optional(),
    }),
};

// Agent schemas
export const agentSchemas = {
    authenticate: z.object({
        agent_id: z.string().min(1),
        name: z.string().min(1),
        email: z.string().email().optional(),
        department: z.string().optional(),
    }),

    register: z.object({
        agent_id: z.string().min(1),
        name: z.string().min(1),
        email: z.string().email().optional(),
        department: z.string().optional(),
    }),
};

// Message schemas
export const messageSchemas = {
    create: z.object({
        session_id: z.string().uuid(),
        sender: z.enum(['customer', 'agent']),
        content: z.string().min(1),
        timestamp: z.string().datetime().optional(),
    }),
};

// Session schemas
export const sessionSchemas = {
    create: z.object({
        customer_id: z.string().uuid(),
        agent_id: z.string().uuid().optional(),
        channel: z.string().optional(),
        metadata: z.record(z.any()).optional(),
    }),

    update: z.object({
        status: z.string().optional(),
        agent_id: z.string().uuid().optional(),
    }),

    close: z.object({
        summary: z.string().optional(),
    }),
};

export default {
    customer: customerSchemas,
    agent: agentSchemas,
    message: messageSchemas,
    session: sessionSchemas,
};
