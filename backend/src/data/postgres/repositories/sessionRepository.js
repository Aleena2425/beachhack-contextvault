/**
 * Session Repository
 * Handles all session-related database operations
 */

import db from '../connection.js';
import logger from '../../../utils/logger.js';

/**
 * Create a new session
 */
export async function create(customerId, agentId, channel = 'web') {
    const result = await db.query(
        `INSERT INTO sessions (customer_id, agent_id, channel, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING *`,
        [customerId, agentId, channel]
    );

    logger.info('Session created', {
        id: result.rows[0].id,
        customerId,
        agentId
    });

    return result.rows[0];
}

/**
 * Find session by ID
 */
export async function findById(id) {
    const result = await db.query(
        'SELECT * FROM sessions WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

/**
 * Find all sessions for a customer
 */
export async function findByCustomer(customerId, limit = 10) {
    const result = await db.query(
        `SELECT * FROM sessions 
         WHERE customer_id = $1 
         ORDER BY started_at DESC 
         LIMIT $2`,
        [customerId, limit]
    );
    return result.rows;
}

/**
 * Find active session for customer
 */
export async function findActiveByCustomer(customerId) {
    const result = await db.query(
        `SELECT * FROM sessions 
         WHERE customer_id = $1 AND status = 'active'
         ORDER BY started_at DESC
         LIMIT 1`,
        [customerId]
    );
    return result.rows[0] || null;
}

/**
 * Close a session
 */
export async function close(id) {
    const result = await db.query(
        `UPDATE sessions 
         SET status = 'closed', ended_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    if (result.rows[0]) {
        logger.info('Session closed', { id });
    }

    return result.rows[0] || null;
}

/**
 * Get recent sessions for customer
 */
export async function getRecentByCustomer(customerId, limit = 5) {
    const result = await db.query(
        `SELECT * FROM sessions
         WHERE customer_id = $1
         ORDER BY started_at DESC
         LIMIT $2`,
        [customerId, limit]
    );
    return result.rows;
}

/**
 * Count active sessions
 */
export async function countActive() {
    const result = await db.query(
        `SELECT COUNT(*) FROM sessions WHERE status = 'active'`
    );
    return parseInt(result.rows[0].count);
}

/**
 * Count total sessions
 */
export async function count() {
    const result = await db.query('SELECT COUNT(*) FROM sessions');
    return parseInt(result.rows[0].count);
}

/**
 * Get session statistics
 */
export async function getStats() {
    const totalResult = await db.query('SELECT COUNT(*) FROM sessions');
    const activeResult = await db.query('SELECT COUNT(*) FROM sessions WHERE status = $1', ['active']);

    return {
        total: parseInt(totalResult.rows[0].count),
        active: parseInt(activeResult.rows[0].count)
    };
}

export default {
    findById,
    findByCustomer,
    findActiveByCustomer,
    create,
    close,
    getRecentByCustomer,
    count,
    countActive,
    getStats
};
