/**
 * Room Manager
 * Manages Socket.io rooms for agents and sessions
 */

import { ROOMS } from './events.js';
import logger from '../utils/logger.js';

// Track connected agents
const connectedAgents = new Map(); // agentId -> socketId

/**
 * Room Manager for Socket.io
 */
export const roomManager = {
    /**
     * Add agent to their room
     */
    joinAgentRoom(socket, agentId) {
        const roomName = ROOMS.agentRoom(agentId);
        socket.join(roomName);
        socket.join(ROOMS.ALL_AGENTS);

        connectedAgents.set(agentId, socket.id);

        logger.info('Agent joined room', { agentId, roomName, socketId: socket.id });
    },

    /**
     * Remove agent from rooms on disconnect
     */
    leaveAgentRooms(socket, agentId) {
        const roomName = ROOMS.agentRoom(agentId);
        socket.leave(roomName);
        socket.leave(ROOMS.ALL_AGENTS);

        connectedAgents.delete(agentId);

        logger.info('Agent left room', { agentId, roomName });
    },

    /**
     * Join agent to a session room
     */
    joinSessionRoom(socket, sessionId) {
        const roomName = ROOMS.sessionRoom(sessionId);
        socket.join(roomName);
        logger.debug('Joined session room', { sessionId, roomName });
    },

    /**
     * Leave session room
     */
    leaveSessionRoom(socket, sessionId) {
        const roomName = ROOMS.sessionRoom(sessionId);
        socket.leave(roomName);
        logger.debug('Left session room', { sessionId });
    },

    /**
     * Check if agent is connected
     */
    isAgentConnected(agentId) {
        return connectedAgents.has(agentId);
    },

    /**
     * Get connected agent socket ID
     */
    getAgentSocketId(agentId) {
        return connectedAgents.get(agentId);
    },

    /**
     * Get all connected agent IDs
     */
    getConnectedAgents() {
        return Array.from(connectedAgents.keys());
    },

    /**
     * Get count of connected agents
     */
    getConnectedCount() {
        return connectedAgents.size;
    },

    /**
     * Clear all connections (for testing/shutdown)
     */
    clearAll() {
        connectedAgents.clear();
    },
};

export default roomManager;
