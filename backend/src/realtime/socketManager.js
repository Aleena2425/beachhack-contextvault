/**
 * Socket.io Manager - Production Architecture
 * Namespace-based with JWT authentication and proper event contracts
 */

import { Server } from 'socket.io';
import { socketAuthMiddleware } from './authMiddleware.js';
import { AGENT_EVENTS, ROOMS } from './events.js';
import sessionRepository from '../data/postgres/repositories/sessionRepository.js';
import logger from '../utils/logger.js';

let io = null;
let agentNamespace = null;

// In-memory agent socket mapping (use Redis for distributed systems)
const agentSocketMap = new Map();

/**
 * Initialize Socket.io server with namespaces
 */
export const initSocketManager = (httpServer, corsOptions = {}) => {
    io = new Server(httpServer, {
        cors: {
            origin: corsOptions.origin ?? '*',
            methods: corsOptions.methods || ['GET', 'POST'],
            allowedHeaders: corsOptions.allowedHeaders || ['Content-Type', 'Authorization'],
            credentials: corsOptions.credentials !== false,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Create agent namespace
    agentNamespace = io.of('/agents');

    // Apply authentication middleware
    agentNamespace.use(socketAuthMiddleware);

    // Connection handler
    agentNamespace.on('connection', async (socket) => {
        const { agent_id, agent_uuid, agent_name } = socket;

        logger.info('Agent connected to namespace', {
            socketId: socket.id,
            agent_id,
            agent_name,
        });

        // Join agent-specific room
        const agentRoom = ROOMS.agentRoom(agent_id);
        socket.join(agentRoom);

        // Store socket mapping
        agentSocketMap.set(agent_id, socket.id);

        // Get active sessions and join rooms
        const activeSessions = await getActiveSessionsForAgent(agent_uuid);
        for (const session of activeSessions) {
            socket.join(ROOMS.sessionRoom(session.id));
            socket.join(ROOMS.customerRoom(session.customer_id));
        }

        // Emit connection established
        socket.emit(AGENT_EVENTS.CONNECTION_ESTABLISHED, {
            agent_id,
            agent_uuid,
            agent_name,
            connected_at: new Date().toISOString(),
            room: agentRoom,
            active_sessions: activeSessions.length,
        });

        // Register event handlers
        registerAgentEventHandlers(socket);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            logger.info('Agent disconnected', {
                agent_id,
                reason,
                socketId: socket.id,
            });

            // Remove from socket map
            agentSocketMap.delete(agent_id);
        });
    });

    logger.info('Socket.io manager initialized with /agents namespace');
    return io;
};

/**
 * Register agent event handlers
 */
function registerAgentEventHandlers(socket) {
    const { agent_id, agent_uuid } = socket;

    // Agent requests insight refresh
    socket.on(AGENT_EVENTS.REQUEST_INSIGHT, async (data) => {
        try {
            const { customer_id, session_id, reason } = data;

            logger.info('Agent requested insight', {
                agent_id,
                customer_id,
                session_id,
                reason,
            });

            // Verify agent is assigned to session
            const session = await sessionRepository.findById(session_id);
            if (!session || session.agent_id !== agent_uuid) {
                socket.emit(AGENT_EVENTS.ERROR, {
                    error_id: `err_${Date.now()}`,
                    code: 'UNAUTHORIZED',
                    message: 'Not assigned to this session',
                    session_id,
                    timestamp: new Date().toISOString(),
                    severity: 'warning',
                });
                return;
            }

            // Trigger insight generation (handled by service layer)
            // This would call the RAG pipeline and emit result
            // For now, acknowledge receipt
            socket.emit('insight:requested', {
                session_id,
                status: 'processing',
            });
        } catch (error) {
            logger.error('Error handling insight request', {
                error: error.message,
                agent_id,
            });

            socket.emit(AGENT_EVENTS.ERROR, {
                error_id: `err_${Date.now()}`,
                code: 'INSIGHT_REQUEST_FAILED',
                message: error.message,
                timestamp: new Date().toISOString(),
                severity: 'error',
            });
        }
    });

    // Agent requests state sync (after reconnection)
    socket.on('agent:sync_state', async () => {
        try {
            logger.info('Agent requested state sync', { agent_id });

            const activeSessions = await getActiveSessionsForAgent(agent_uuid);

            // Re-join rooms
            for (const session of activeSessions) {
                socket.join(ROOMS.sessionRoom(session.id));
                socket.join(ROOMS.customerRoom(session.customer_id));
            }

            // Send sync confirmation
            socket.emit('agent:state_synced', {
                active_sessions: activeSessions.length,
                sessions: activeSessions.map(s => ({
                    session_id: s.id,
                    customer_id: s.customer_id,
                    status: s.status,
                })),
                synced_at: new Date().toISOString(),
            });
        } catch (error) {
            logger.error('Error syncing agent state', {
                error: error.message,
                agent_id,
            });
        }
    });
}

/**
 * Get active sessions for agent
 */
async function getActiveSessionsForAgent(agent_uuid) {
    try {
        return await sessionRepository.getActiveSessions(agent_uuid);
    } catch (error) {
        logger.error('Error fetching active sessions', {
            error: error.message,
            agent_uuid,
        });
        return [];
    }
}

/**
 * Get Socket.io instance
 */
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocketManager() first.');
    }
    return io;
};

/**
 * Get agent namespace
 */
export const getAgentNamespace = () => {
    if (!agentNamespace) {
        throw new Error('Agent namespace not initialized.');
    }
    return agentNamespace;
};

/**
 * Push customer insight to agent
 */
export const pushInsightToAgent = (agent_id, insight) => {
    if (!agentNamespace) {
        logger.warn('Cannot push insight - Agent namespace not initialized');
        return false;
    }

    const roomName = ROOMS.agentRoom(agent_id);

    agentNamespace.to(roomName).emit(AGENT_EVENTS.CUSTOMER_INSIGHT, {
        event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customer_id: insight.customerId,
        customer_external_id: insight.customerExternalId,
        session_id: insight.sessionId,
        timestamp: new Date().toISOString(),

        insight: {
            type: insight.type || 'message_insight',
            summary: insight.summary,
            profile: insight.profile,
            recommendations: insight.recommendations || [],
            confidence: insight.confidence || 0.85,
        },
    });

    logger.info('Pushed customer insight to agent', {
        agent_id,
        customer_id: insight.customerId,
        type: insight.type,
    });

    return true;
};

/**
 * Push analysis update to agent
 */
export const pushAnalysisUpdate = (agent_id, session_id, analysis) => {
    if (!agentNamespace) return false;

    const roomName = ROOMS.agentRoom(agent_id);

    agentNamespace.to(roomName).emit(AGENT_EVENTS.ANALYSIS_UPDATE, {
        event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id,
        customer_id: analysis.customerId,
        timestamp: new Date().toISOString(),

        analysis: {
            current_intent: analysis.intent,
            urgency: analysis.urgency,
            sentiment: analysis.sentiment,
            message_summary: analysis.summary,
            suggested_responses: analysis.suggestedResponses || [],
            extracted_info: analysis.extractedInfo || {},
            confidence: analysis.confidence || 0.85,
        },
    });

    logger.debug('Pushed analysis update to agent', {
        agent_id,
        session_id,
    });

    return true;
};

/**
 * Notify agent of session start
 */
export const notifySessionStarted = (agent_id, session, customer) => {
    if (!agentNamespace) return false;

    const roomName = ROOMS.agentRoom(agent_id);

    agentNamespace.to(roomName).emit(AGENT_EVENTS.SESSION_STARTED, {
        session_id: session.id,
        customer: {
            id: customer.id,
            external_id: customer.external_id,
            name: customer.name,
            email: customer.email,
            is_returning: customer.total_sessions > 0,
            total_sessions: customer.total_sessions,
        },
        assigned_at: new Date().toISOString(),
        channel: session.channel || 'web',
    });

    logger.info('Notified agent of session start', {
        agent_id,
        session_id: session.id,
        customer_id: customer.id,
    });

    return true;
};

/**
 * Notify agent of session end
 */
export const notifySessionEnded = (agent_id, session_id, summary) => {
    if (!agentNamespace) return false;

    const roomName = ROOMS.agentRoom(agent_id);

    agentNamespace.to(roomName).emit(AGENT_EVENTS.SESSION_ENDED, {
        session_id,
        customer_id: summary.customer_id,
        ended_at: new Date().toISOString(),
        duration_minutes: summary.duration_minutes,

        summary: {
            outcome: summary.outcome,
            ai_summary: summary.ai_summary,
            message_count: summary.message_count,
            sentiment_final: summary.sentiment_final,
        },
    });

    logger.info('Notified agent of session end', {
        agent_id,
        session_id,
    });

    return true;
};

/**
 * Push error to agent
 */
export const pushErrorToAgent = (agent_id, error) => {
    if (!agentNamespace) return false;

    const roomName = ROOMS.agentRoom(agent_id);

    agentNamespace.to(roomName).emit(AGENT_EVENTS.ERROR, {
        error_id: `err_${Date.now()}`,
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        session_id: error.session_id,
        timestamp: new Date().toISOString(),
        severity: error.severity || 'error',
        fallback: error.fallback,
    });

    return true;
};

/**
 * Join agent to session rooms
 */
export const joinAgentToSessionRooms = async (agent_id, session_id, customer_id) => {
    if (!agentNamespace) return false;

    const socketId = agentSocketMap.get(agent_id);
    if (!socketId) {
        logger.warn('Cannot join rooms - agent not connected', { agent_id });
        return false;
    }

    const socket = agentNamespace.sockets.get(socketId);
    if (!socket) return false;

    socket.join(ROOMS.sessionRoom(session_id));
    socket.join(ROOMS.customerRoom(customer_id));

    logger.debug('Agent joined session rooms', {
        agent_id,
        session_id,
        customer_id,
    });

    return true;
};

/**
 * Remove agent from session rooms
 */
export const leaveAgentFromSessionRooms = async (agent_id, session_id, customer_id) => {
    if (!agentNamespace) return false;

    const socketId = agentSocketMap.get(agent_id);
    if (!socketId) return false;

    const socket = agentNamespace.sockets.get(socketId);
    if (!socket) return false;

    socket.leave(ROOMS.sessionRoom(session_id));
    socket.leave(ROOMS.customerRoom(customer_id));

    logger.debug('Agent left session rooms', {
        agent_id,
        session_id,
    });

    return true;
};

export default {
    initSocketManager,
    getIO,
    getAgentNamespace,
    pushInsightToAgent,
    pushAnalysisUpdate,
    notifySessionStarted,
    notifySessionEnded,
    pushErrorToAgent,
    joinAgentToSessionRooms,
    leaveAgentFromSessionRooms,
};
