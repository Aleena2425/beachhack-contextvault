/**
 * Agent Socket.io Namespace
 * Handles real-time communication with agents
 */

import logger from '../utils/logger.js';

let agentNamespace = null;

/**
 * Initialize the /agent namespace
 */
export function initializeAgentSocket(io) {
    agentNamespace = io.of('/agent');

    agentNamespace.on('connection', (socket) => {
        logger.info('Agent connected', { socketId: socket.id });

        socket.on('disconnect', () => {
            logger.info('Agent disconnected', { socketId: socket.id });
        });

        // Optional: Agent can identify themselves
        socket.on('identify', (data) => {
            socket.agentId = data.agentId;
            logger.info('Agent identified', {
                socketId: socket.id,
                agentId: data.agentId
            });
        });
    });

    logger.info('Agent Socket.io namespace initialized');
    return agentNamespace;
}

/**
 * Emit AI insights to all connected agents
 */
export function emitInsights(customerUuid, insights) {
    if (!agentNamespace) {
        logger.warn('Agent namespace not initialized, cannot emit insights');
        return;
    }

    const payload = {
        customerUuid,
        insights,
        timestamp: new Date().toISOString()
    };

    agentNamespace.emit('ai:insights', payload);

    const connectedAgents = agentNamespace.sockets.size;
    logger.info('Insights emitted to agents', {
        customerUuid,
        connectedAgents,
        sentiment: insights.sentiment,
        intent: insights.intent
    });
}

/**
 * Emit profile update to agents (for future use)
 */
export function emitProfileUpdate(customerUuid, profile) {
    if (!agentNamespace) {
        logger.warn('Agent namespace not initialized');
        return;
    }

    agentNamespace.emit('ai:profile_update', {
        customerUuid,
        profile,
        timestamp: new Date().toISOString()
    });

    logger.info('Profile update emitted', { customerUuid });
}

export default {
    initializeAgentSocket,
    emitInsights,
    emitProfileUpdate
};
