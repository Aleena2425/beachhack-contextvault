/**
 * Agent Controller
 * Handles HTTP requests for agent operations
 */

import agentService from '../../services/agentService.js';
import { generateAgentToken } from '../../realtime/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const authenticateAgent = asyncHandler(async (req, res) => {
    const agent = await agentService.registerOrAuthenticate(req.body);

    // Generate JWT token for Socket.io connection
    const token = generateAgentToken(agent);

    res.status(200).json({
        agent: {
            id: agent.id,
            agent_id: agent.agent_id,
            name: agent.name,
            email: agent.email,
        },
        token,
        socket_namespace: '/agents',
    });
});

export const getAgent = asyncHandler(async (req, res) => {
    const agent = await agentService.getAgentWithStats(req.params.id);
    res.status(200).json(agent);
});

export const getActiveSessions = asyncHandler(async (req, res) => {
    const sessions = await agentService.getActiveSessions(req.params.id);
    res.status(200).json(sessions);
});

export const getActiveAgents = asyncHandler(async (req, res) => {
    const agents = await agentService.getActiveAgents();
    res.status(200).json(agents);
});

export default {
    authenticateAgent,
    getAgent,
    getActiveSessions,
    getActiveAgents,
};
