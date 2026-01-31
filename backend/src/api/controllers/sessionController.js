/**
 * Session Controller
 * Handles HTTP requests for session operations
 */

import sessionService from '../../services/sessionService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createSession = asyncHandler(async (req, res) => {
    const session = await sessionService.createSession({
        customerId: req.body.customer_id,
        agentId: req.body.agent_id,
        channel: req.body.channel,
        metadata: req.body.metadata,
    });
    res.status(201).json(session);
});

export const getSession = asyncHandler(async (req, res) => {
    const session = await sessionService.getSessionWithDetails(req.params.id);
    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    res.status(200).json(session);
});

export const updateSession = asyncHandler(async (req, res) => {
    // Handle specific updates like assignment or status change
    let result;
    if (req.body.agent_id) {
        result = await sessionService.assignAgent(req.params.id, req.body.agent_id);
    } else if (req.body.status === 'closed') {
        result = await sessionService.closeSession(req.params.id, req.body.summary);
    } else {
        // Generic update (if needed)
        result = await sessionService.getSession(req.params.id);
    }
    res.status(200).json(result);
});

export const getSessionSummary = asyncHandler(async (req, res) => {
    const session = await sessionService.getSession(req.params.id);
    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    res.status(200).json({ summary: session.session_summary });
});

export default {
    createSession,
    getSession,
    updateSession,
    getSessionSummary,
};
