/**
 * Profile Repository
 * Handles customer profile operations with incremental updates
 * NEVER overwrites - only accumulates data
 */

import db from '../connection.js';
import logger from '../../../utils/logger.js';

/**
 * Get profile for customer (or create empty one)
 */
export async function getOrCreate(customerId) {
    // Try to find existing
    let result = await db.query(
        'SELECT * FROM customer_profiles WHERE customer_id = $1',
        [customerId]
    );

    if (result.rows[0]) {
        return result.rows[0];
    }

    // Create empty profile
    result = await db.query(
        `INSERT INTO customer_profiles (customer_id, profile_data)
         VALUES ($1, '{}')
         RETURNING *`,
        [customerId]
    );

    logger.info('Profile created', { customerId });
    return result.rows[0];
}

/**
 * Update profile with new insight (incremental)
 */
export async function updateWithInsight(customerId, insight) {
    const profile = await getOrCreate(customerId);

    // Build updated profile data
    const profileData = profile.profile_data || {};

    // Append to intent history (keep last 20)
    const intentHistory = profileData.intentHistory || [];
    intentHistory.push(insight.intent);
    if (intentHistory.length > 20) intentHistory.shift();

    // Append to urgency history (keep last 20)
    const urgencyHistory = profileData.urgencyHistory || [];
    urgencyHistory.push(insight.urgency);
    if (urgencyHistory.length > 20) urgencyHistory.shift();

    const updatedProfileData = {
        ...profileData,
        intentHistory,
        urgencyHistory,
        lastUpdated: new Date().toISOString()
    };

    // Update database
    const result = await db.query(
        `UPDATE customer_profiles SET
            profile_data = $2,
            interaction_count = interaction_count + 1,
            last_intent = $3,
            last_updated = CURRENT_TIMESTAMP
         WHERE customer_id = $1
         RETURNING *`,
        [
            customerId,
            JSON.stringify(updatedProfileData),
            insight.intent
        ]
    );

    logger.debug('Profile updated', {
        customerId,
        interactionCount: result.rows[0].interaction_count
    });

    return result.rows[0];
}

/**
 * Add topic to common topics
 */
export async function addTopic(customerId, topic) {
    await db.query(
        `UPDATE customer_profiles SET
            common_topics = array_append(
                COALESCE(common_topics, '{}'), 
                $2::text
            )
         WHERE customer_id = $1`,
        [customerId, topic]
    );
}

/**
 * Get profile by customer ID
 */
export async function getByCustomerId(customerId) {
    const result = await db.query(
        'SELECT * FROM customer_profiles WHERE customer_id = $1',
        [customerId]
    );
    return result.rows[0] || null;
}

export default {
    getOrCreate,
    updateWithInsight,
    addTopic,
    getByCustomerId
};
