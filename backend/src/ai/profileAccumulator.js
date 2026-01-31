/**
 * Profile Accumulator
 * Manages customer profile updates - NEVER overwrites, always accumulates
 */

import customerRepository from '../data/postgres/repositories/customerRepository.js';
import { upsertCustomerProfile } from '../data/vector/collections.js';
import { embed } from './embeddingService.js';
import { deepMerge } from '../utils/helpers.js';
import logger from '../utils/logger.js';
import db from '../data/postgres/connection.js';

export const profileAccumulator = {
    /**
     * Update customer profile with extracted data from AI
     * This NEVER overwrites - it always merges/appends
     */
    async updateFromInsight(customerId, extractedData) {
        const existing = await customerRepository.findById(customerId);
        if (!existing) {
            throw new Error(`Customer not found: ${customerId}`);
        }

        logger.debug('Updating profile from insight', { customerId });

        // Update structured data in PostgreSQL
        const updates = {};

        // Merge preferences (union, not replace)
        if (extractedData.preferences && Object.keys(extractedData.preferences).length > 0) {
            updates.preferences = deepMerge(existing.preferences || {}, extractedData.preferences);
        }

        // Update in database
        if (Object.keys(updates).length > 0) {
            await customerRepository.updateWithAccumulation(customerId, updates);
        }

        // Add intent to history if present
        if (extractedData.intent) {
            await customerRepository.addExtractedIntent(customerId, extractedData.intent);
        }

        // Log preference extraction to history
        if (extractedData.preferences) {
            await this.logPreferenceHistory(customerId, extractedData.preferences, extractedData.sessionId);
        }

        logger.info('Profile updated from insight', { customerId });

        return await customerRepository.findById(customerId);
    },

    /**
     * Log preference extraction to history table
     */
    async logPreferenceHistory(customerId, preferences, sessionId = null) {
        for (const [key, value] of Object.entries(preferences)) {
            if (value !== null && value !== undefined) {
                try {
                    await db.query(
                        `INSERT INTO preference_history (customer_id, preference_key, preference_value, source_session_id, confidence)
             VALUES ($1, $2, $3, $4, $5)`,
                        [customerId, key, typeof value === 'object' ? JSON.stringify(value) : String(value), sessionId, 0.8]
                    );
                } catch (error) {
                    logger.warn('Failed to log preference history', { error: error.message, key });
                }
            }
        }
    },

    /**
     * Update customer profile in vector database
     */
    async updateVectorProfile(customerId) {
        const customer = await customerRepository.getProfile(customerId);
        if (!customer) {
            throw new Error(`Customer not found: ${customerId}`);
        }

        // Create profile summary text
        const profileText = this.buildProfileSummary(customer);

        try {
            // Generate embedding
            const profileEmbedding = await embed(profileText);

            // Upsert in ChromaDB
            await upsertCustomerProfile({
                id: `profile_${customerId}`,
                customerId,
                embedding: profileEmbedding,
                document: profileText,
                totalInteractions: customer.total_sessions || 0,
                primaryInterests: customer.tags || [],
            });

            logger.debug('Updated vector profile', { customerId });
        } catch (error) {
            logger.warn('Failed to update vector profile', { error: error.message });
            // Don't throw - vector update is non-critical
        }
    },

    /**
     * Build a text summary of customer profile for embedding
     */
    buildProfileSummary(customer) {
        const parts = [];

        if (customer.name) parts.push(`Customer: ${customer.name}`);
        if (customer.email) parts.push(`Email: ${customer.email}`);

        if (customer.preferences && Object.keys(customer.preferences).length > 0) {
            parts.push(`Preferences: ${JSON.stringify(customer.preferences)}`);
        }

        if (customer.tags && customer.tags.length > 0) {
            parts.push(`Interests: ${customer.tags.join(', ')}`);
        }

        if (customer.extracted_intents && customer.extracted_intents.length > 0) {
            const recentIntents = customer.extracted_intents.slice(-5).map(i => i.intent);
            parts.push(`Recent intents: ${recentIntents.join(', ')}`);
        }

        parts.push(`Total sessions: ${customer.total_sessions || 0}`);

        return parts.join('. ') + '.';
    },

    /**
     * Add tags to customer profile
     */
    async addTags(customerId, tags) {
        if (!tags || tags.length === 0) return;

        await customerRepository.addTags(customerId, tags);

        // Also update vector profile
        await this.updateVectorProfile(customerId);

        logger.debug('Added tags to profile', { customerId, tags });
    },
};

/**
 * Alias for updateFromInsight (used by RAG pipeline)
 */
export const updateProfile = profileAccumulator.updateFromInsight.bind(profileAccumulator);

export default profileAccumulator;
