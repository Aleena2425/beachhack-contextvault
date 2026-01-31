/**
 * Agent Service
 * Business logic for agent operations
 */

import agentRepository from '../data/postgres/repositories/agentRepository.js';
import sessionRepository from '../data/postgres/repositories/sessionRepository.js';
import logger from '../utils/logger.js';

export const agentService = {
    /**
     * Register or authenticate an agent from external website
     */
    async registerOrAuthenticate(data) {
        const { agent, isNew } = await agentRepository.registerOrAuthenticate({
            agentId: data.agent_id,
            name: data.name,
            email: data.email,
            department: data.department,
        });

        logger.info('Agent registered/authenticated', {
            agentId: agent.agent_id,
            isNew
        });

        return { agent, isNew };
    },

    /**
     * Get agent by external agent_id
     */
    async getByAgentId(agentId) {
        return agentRepository.findByAgentId(agentId);
    },

    /**
     * Get agent by internal UUID
     */
    async getById(id) {
        return agentRepository.findById(id);
    },

    /**
     * Get agent with statistics
     */
    async getAgentWithStats(agentId) {
        const agent = await agentRepository.findByAgentId(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        return agentRepository.getAgentWithStats(agent.id);
    },

    /**
     * Get active sessions for an agent
     */
    async getActiveSessions(agentId) {
        const agent = await agentRepository.findByAgentId(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        return sessionRepository.getActiveSessions(agent.id);
    },

    /**
     * Get all active agents
     */
    async getActiveAgents() {
        return agentRepository.getActiveAgents();
    },

    /**
     * Set agent active status
     */
    async setActive(agentId, isActive) {
        const agent = await agentRepository.findByAgentId(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        return agentRepository.setActive(agent.id, isActive);
    },
};

export default agentService;
