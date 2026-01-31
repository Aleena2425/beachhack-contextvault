/**
 * Insight Repository
 * Handles all AI insight-related database operations
 */

import db from '../connection.js';
import logger from '../../../utils/logger.js';

/**
 * Create a new insight
 */
export async function create(customerId, sessionId, messageId, insightData) {
    const result = await db.query(
        `INSERT INTO ai_insights (
            customer_id, session_id, message_id,
            intent, urgency, summary, suggestions, confidence
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
            customerId,
            sessionId,
            messageId,
            insightData.intent,
            insightData.urgency,
            insightData.summary || null,
            JSON.stringify(insightData.suggestions || []),
            insightData.confidence || 0.0
        ]
    );

    logger.debug('Insight created', {
        id: result.rows[0].id,
        customerId
    });

    return result.rows[0];
}

/**
 * Get insights by session
 */
export async function getBySession(sessionId, limit = 10) {
    const result = await db.query(
        `SELECT * FROM ai_insights
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [sessionId, limit]
    );
    return result.rows;
}

/**
 * Get insights by customer
 */
export async function getByCustomer(customerId, limit = 10) {
    const result = await db.query(
        `SELECT * FROM ai_insights
         WHERE customer_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [customerId, limit]
    );
    return result.rows;
}

/**
 * Find latest insight by session
 */
export async function findLatestBySession(sessionId) {
    const result = await db.query(
        `SELECT * FROM ai_insights
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [sessionId]
    );
    return result.rows[0] || null;
}

/**
 * Get aggregated stats for customer
 */
export async function getStats(customerId) {
    const result = await db.query(
        `SELECT 
            COUNT(*) as total_insights,
            COUNT(DISTINCT session_id) as sessions_with_insights,
            mode() WITHIN GROUP (ORDER BY intent) as most_common_intent,
            mode() WITHIN GROUP (ORDER BY urgency) as most_common_urgency
         FROM ai_insights
         WHERE customer_id = $1`,
        [customerId]
    );

    return result.rows[0] || null;
}

/**
 * Count total insights
 */
export async function count() {
    const result = await db.query('SELECT COUNT(*) FROM ai_insights');
    return parseInt(result.rows[0].count);
}

export default {
    create,
    getBySession,
    getByCustomer,
    findLatestBySession,
    getStats,
    count
};
