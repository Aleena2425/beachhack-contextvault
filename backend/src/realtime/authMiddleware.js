/**
 * JWT Authentication Middleware
 * Validates JWT tokens for Socket.io connections
 */

import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import agentRepository from '../data/postgres/repositories/agentRepository.js';
import logger from '../utils/logger.js';

/**
 * Socket.io authentication middleware
 */
export const socketAuthMiddleware = async (socket, next) => {
    try {
        const { token, agent_id } = socket.handshake.auth;

        // Check if credentials provided
        if (!token || !agent_id) {
            logger.warn('Socket connection rejected - missing credentials', {
                socketId: socket.id,
            });
            return next(new Error('Authentication required'));
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt.secret);
        } catch (error) {
            logger.warn('Socket connection rejected - invalid token', {
                socketId: socket.id,
                error: error.message,
            });
            return next(new Error('Invalid token'));
        }

        // Verify agent_id matches token
        if (decoded.agent_id !== agent_id) {
            logger.warn('Socket connection rejected - agent_id mismatch', {
                socketId: socket.id,
                tokenAgentId: decoded.agent_id,
                providedAgentId: agent_id,
            });
            return next(new Error('Invalid agent_id'));
        }

        // Verify agent exists in database
        const agent = await agentRepository.findByAgentId(agent_id);
        if (!agent) {
            logger.warn('Socket connection rejected - agent not found', {
                socketId: socket.id,
                agent_id,
            });
            return next(new Error('Agent not found'));
        }

        // Attach agent data to socket
        socket.agent_id = agent_id;
        socket.agent_uuid = agent.id;
        socket.agent_name = agent.name;
        socket.agent_email = agent.email;

        logger.debug('Socket authentication successful', {
            socketId: socket.id,
            agent_id,
            agent_name: agent.name,
        });

        next();
    } catch (error) {
        logger.error('Socket authentication error', {
            error: error.message,
            socketId: socket.id,
        });
        next(new Error('Authentication failed'));
    }
};

/**
 * Generate JWT token for agent
 */
export const generateAgentToken = (agent) => {
    const payload = {
        agent_id: agent.agent_id,
        agent_uuid: agent.id,
        name: agent.name,
        iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn || '24h',
    });
};

export default {
    socketAuthMiddleware,
    generateAgentToken,
};
