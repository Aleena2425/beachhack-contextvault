/**
 * Agent Repository
 * Handles all agent-related database operations
 */

import db from '../connection.js';
import logger from '../../../utils/logger.js';

/**
 * Find agent by internal UUID
 */
export async function findById(id) {
    const result = await db.query(
        'SELECT * FROM agents WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

/**
 * Find agent by agent_id (external identifier)
 */
export async function findByAgentId(agentId) {
    const result = await db.query(
        'SELECT * FROM agents WHERE agent_id = $1',
        [agentId]
    );
    return result.rows[0] || null;
}

/**
 * Create a new agent
 */
export async function create(data) {
    const result = await db.query(
        `INSERT INTO agents (agent_id, name, email, skills, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
            data.agentId,
            data.name,
            data.email || null,
            data.skills || [],
            data.status || 'available'
        ]
    );

    logger.info('Agent created', {
        id: result.rows[0].id,
        agentId: data.agentId
    });

    return result.rows[0];
}

/**
 * Update agent status
 */
export async function updateStatus(id, status) {
    const result = await db.query(
        `UPDATE agents SET status = $2 WHERE id = $1 RETURNING *`,
        [id, status]
    );
    return result.rows[0] || null;
}

/**
 * Get or create agent
 */
export async function getOrCreate(agentId, data = {}) {
    let agent = await findByAgentId(agentId);

    if (agent) {
        return { agent, isNew: false };
    }

    agent = await create({
        agentId,
        name: data.name || `Agent ${agentId}`,
        email: data.email,
        skills: data.skills,
        status: data.status
    });

    return { agent, isNew: true };
}

/**
 * Count total agents
 */
export async function count() {
    const result = await db.query('SELECT COUNT(*) FROM agents');
    return parseInt(result.rows[0].count);
}

export default {
    findById,
    findByAgentId,
    create,
    updateStatus,
    getOrCreate,
    count
};
