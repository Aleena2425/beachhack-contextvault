/**
 * Customer Profile Repository
 * One profile per customer; structured fields. Enforced by customer_id PK/FK.
 */

import db from '../connection.js';
import logger from '../../../utils/logger.js';

export const customerProfileRepository = {
    /**
     * Get profile by customer UUID (internal).
     */
    async findByCustomerId(customerId) {
        const result = await db.query(
            'SELECT * FROM customer_profiles WHERE customer_id = $1',
            [customerId]
        );
        return result.rows[0] || null;
    },

    /**
     * Get or create profile for a customer. Ensures exactly one profile per customer.
     */
    async getOrCreate(customerId) {
        let profile = await this.findByCustomerId(customerId);
        if (profile) return profile;

        const result = await db.query(
            `INSERT INTO customer_profiles (customer_id)
             VALUES ($1)
             ON CONFLICT (customer_id) DO UPDATE SET updated_at = NOW()
             RETURNING *`,
            [customerId]
        );
        logger.debug('Customer profile getOrCreate', { customerId, id: result.rows[0].customer_id });
        return result.rows[0];
    },

    /**
     * Create profile (fails if already exists; use getOrCreate for upsert).
     */
    async create(customerId, data = {}) {
        const result = await db.query(
            `INSERT INTO customer_profiles (
                customer_id, summary, primary_intent, preferred_channel,
                sentiment_trend, key_topics, product_affinities, last_summary_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                customerId,
                data.summary ?? null,
                data.primaryIntent ?? null,
                data.preferredChannel ?? null,
                data.sentimentTrend ?? null,
                data.keyTopics ?? [],
                JSON.stringify(data.productAffinities ?? {}),
                data.lastSummaryAt ?? null,
            ]
        );
        logger.info('Created customer profile', { customerId });
        return result.rows[0];
    },

    /**
     * Update structured profile fields (merge, not replace arrays/jsonb where sensible).
     */
    async update(customerId, data) {
        const result = await db.query(
            `UPDATE customer_profiles SET
                summary = COALESCE($2, summary),
                primary_intent = COALESCE($3, primary_intent),
                preferred_channel = COALESCE($4, preferred_channel),
                sentiment_trend = COALESCE($5, sentiment_trend),
                key_topics = COALESCE($6, key_topics),
                product_affinities = COALESCE($7, product_affinities),
                last_summary_at = COALESCE($8, last_summary_at),
                updated_at = NOW()
             WHERE customer_id = $1
             RETURNING *`,
            [
                customerId,
                data.summary ?? null,
                data.primaryIntent ?? null,
                data.preferredChannel ?? null,
                data.sentimentTrend ?? null,
                data.keyTopics ?? null,
                data.productAffinities != null ? JSON.stringify(data.productAffinities) : null,
                data.lastSummaryAt ?? null,
            ]
        );
        if (result.rowCount === 0) return null;
        return result.rows[0];
    },

    /**
     * Append topics (union with existing).
     */
    async addTopics(customerId, topics) {
        const result = await db.query(
            `UPDATE customer_profiles SET
                key_topics = ARRAY(SELECT DISTINCT unnest(COALESCE(key_topics, '{}') || $2::text[])),
                updated_at = NOW()
             WHERE customer_id = $1
             RETURNING *`,
            [customerId, topics]
        );
        return result.rows[0] || null;
    },

    /**
     * Get customer with profile (join).
     */
    async getCustomerWithProfile(customerId) {
        const result = await db.query(
            `SELECT c.*, p.summary as profile_summary, p.primary_intent, p.preferred_channel,
                    p.sentiment_trend, p.key_topics, p.product_affinities, p.last_summary_at
             FROM customers c
             LEFT JOIN customer_profiles p ON p.customer_id = c.id
             WHERE c.id = $1`,
            [customerId]
        );
        return result.rows[0] || null;
    },

    /**
     * List profiles updated after a timestamp (e.g. for sync or backfill).
     */
    async listUpdatedAfter(since, limit = 100) {
        const result = await db.query(
            `SELECT * FROM customer_profiles
             WHERE last_summary_at IS NOT NULL AND last_summary_at > $1
             ORDER BY last_summary_at DESC
             LIMIT $2`,
            [since, limit]
        );
        return result.rows;
    },

    /**
     * Find profiles by topic (GIN index).
     */
    async findByTopic(topic) {
        const result = await db.query(
            `SELECT * FROM customer_profiles WHERE key_topics @> $1::text[]`,
            [[topic]]
        );
        return result.rows;
    },
};

export default customerProfileRepository;
