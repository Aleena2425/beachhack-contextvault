/**
 * Message Repository
 * Handles all message-related database operations
 */

import db from '../connection.js';
import logger from '../../../utils/logger.js';

/**
 * Create a new message
 */
export async function create(sessionId, senderType, content) {
    const result = await db.query(
        `INSERT INTO messages (session_id, sender_type, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [sessionId, senderType, content]
    );

    logger.debug('Message created', {
        id: result.rows[0].id,
        sessionId,
        senderType
    });

    return result.rows[0];
}

/**
 * Update message with AI metadata
 */
export async function updateAIMetadata(id, intent) {
    const result = await db.query(
        `UPDATE messages 
         SET intent = $2
         WHERE id = $1
         RETURNING *`,
        [id, intent]
    );

    return result.rows[0] || null;
}

/**
 * Get messages by session
 */
export async function getBySession(sessionId, limit = 50) {
    const result = await db.query(
        `SELECT * FROM messages
         WHERE session_id = $1
         ORDER BY created_at ASC
         LIMIT $2`,
        [sessionId, limit]
    );
    return result.rows;
}

/**
 * Get recent messages by customer (across sessions)
 */
export async function getRecentByCustomer(customerId, limit = 10) {
    const result = await db.query(
        `SELECT m.* FROM messages m
         JOIN sessions s ON m.session_id = s.id
         WHERE s.customer_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2`,
        [customerId, limit]
    );
    return result.rows.reverse(); // Return in chronological order
}

/**
 * Count total messages
 */
export async function count() {
    const result = await db.query('SELECT COUNT(*) FROM messages');
    return parseInt(result.rows[0].count);
}

/**
 * Count messages by session
 */
export async function countBySession(sessionId) {
    const result = await db.query(
        'SELECT COUNT(*) FROM messages WHERE session_id = $1',
        [sessionId]
    );
    return parseInt(result.rows[0].count);
}

export default {
    create,
    updateAIMetadata,
    getBySession,
    getRecentByCustomer,
    count,
    countBySession
};
