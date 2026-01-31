/**
 * Session Service
 * Business logic for chat session operations
 */

import sessionRepository from '../data/postgres/repositories/sessionRepository.js';
import customerRepository from '../data/postgres/repositories/customerRepository.js';
import agentRepository from '../data/postgres/repositories/agentRepository.js';
import messageRepository from '../data/postgres/repositories/messageRepository.js';
import { notifySessionStarted, notifySessionEnded, joinAgentToSessionRooms, leaveAgentFromSessionRooms } from '../realtime/socketManager.js';
import { buildSessionSummaryPrompt } from '../ai/promptBuilder.js';
import { generateSessionSummary } from '../ai/geminiProcessor.js';
import logger from '../utils/logger.js';

export const sessionService = {
    /**
     * Create a new chat session
     */
    async createSession(data) {
        const { customerId, agentId, channel, metadata } = data;

        // Validate customer exists
        const customer = await customerRepository.findById(customerId);
        if (!customer) {
            throw new Error(`Customer not found: ${customerId}`);
        }

        // Validate agent if provided
        let agent = null;
        if (agentId) {
            agent = await agentRepository.findById(agentId);
            if (!agent) {
                throw new Error(`Agent not found: ${agentId}`);
            }
        }

        // Create session
        const session = await sessionRepository.create({
            customerId,
            agentId,
            channel: channel || 'web',
            metadata,
        });

        // Increment customer session count
        await customerRepository.updateWithAccumulation(customerId, { incrementSessions: true });

        // Notify agent if assigned
        if (agent) {
            // Join agent to session rooms
            await joinAgentToSessionRooms(agent.agent_id, session.id, customerId);

            // Notify session started
            notifySessionStarted(agent.agent_id, session, customer);
        }

        logger.info('Session created', { sessionId: session.id, customerId, agentId });

        return session;
    },

    /**
     * Get session by ID
     */
    async getSession(sessionId) {
        return sessionRepository.findById(sessionId);
    },

    /**
     * Get session with full details
     */
    async getSessionWithDetails(sessionId) {
        return sessionRepository.getSessionWithDetails(sessionId);
    },

    /**
     * Assign agent to session
     */
    async assignAgent(sessionId, agentId) {
        const agent = await agentRepository.findByAgentId(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }

        const session = await sessionRepository.assignAgent(sessionId, agent.id);

        // Get customer for notification
        const customer = await customerRepository.findById(session.customer_id);

        // Join agent to session rooms
        await joinAgentToSessionRooms(agentId, session.id, session.customer_id);

        // Notify new agent
        notifySessionStarted(agentId, session, customer);

        logger.info('Agent assigned to session', { sessionId, agentId });

        return session;
    },

    /**
     * Close a session. If no summary provided, generate one asynchronously (AI never blocks close).
     */
    async closeSession(sessionId, summary = null) {
        const session = await sessionRepository.getSessionWithDetails(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const closedSession = await sessionRepository.close(sessionId, summary);

        if (!summary) {
            this.generateSessionSummaryAsync(sessionId).catch((err) => {
                logger.warn('Async session summary failed', { sessionId, error: err.message });
            });
        }

        if (session.agent_id) {
            const agent = await agentRepository.findById(session.agent_id);
            if (agent) {
                await leaveAgentFromSessionRooms(agent.agent_id, sessionId, session.customer_id);
                notifySessionEnded(agent.agent_id, sessionId, summary);
            }
        }

        logger.info('Session closed', { sessionId });
        return closedSession;
    },

    /**
     * Generate session summary with Gemini (async; never blocks chat or close).
     */
    async generateSessionSummaryAsync(sessionId) {
        const messages = await messageRepository.getSessionMessages(sessionId, { limit: 200 });
        if (!messages.length) return;

        const prompt = buildSessionSummaryPrompt(
            messages.map((m) => ({ sender_type: m.sender_type, content: m.content }))
        );
        const summary = await generateSessionSummary(prompt);
        if (summary && typeof summary === 'string') {
            await sessionRepository.updateWithAIData(sessionId, { summary });
            logger.info('Session summary generated', { sessionId });
        }
    },

    /**
     * Update session with AI data
     */
    async updateWithAIData(sessionId, data) {
        return sessionRepository.updateWithAIData(sessionId, data);
    },

    /**
     * Get active sessions for agent
     */
    async getAgentActiveSessions(agentId) {
        const agent = await agentRepository.findByAgentId(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        return sessionRepository.getActiveSessions(agent.id);
    },

    /**
     * Get customer's session history
     */
    async getCustomerSessions(customerId, limit = 10) {
        return sessionRepository.getCustomerSessions(customerId, limit);
    },

    /**
     * Get session statistics
     */
    async getStats() {
        return sessionRepository.getStats();
    },
};

export default sessionService;
