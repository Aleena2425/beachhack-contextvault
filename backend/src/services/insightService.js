/**
 * Insight Service
 * Business logic for AI insights operations
 */

import insightRepository from '../data/postgres/repositories/insightRepository.js';
import ragPipeline from '../ai/ragPipeline.js';
import logger from '../utils/logger.js';

export const insightService = {
    /**
     * Generate on-demand insight for a customer
     */
    async generateCustomerInsight(customerId) {
        logger.info('Generating on-demand customer insight', { customerId });

        const insight = await ragPipeline.generateReturningCustomerInsight(customerId);

        // Store the insight
        await insightRepository.create({
            customerId,
            type: 'on_demand_summary',
            content: JSON.stringify(insight),
            confidenceScore: 0.9,
            modelVersion: 'gemini-2.0-flash',
            processingTimeMs: insight.totalProcessingTime,
        });

        return insight;
    },

    /**
     * Get insights for a session
     */
    async getSessionInsights(sessionId) {
        return insightRepository.getSessionInsights(sessionId);
    },

    /**
     * Get insights for a customer
     */
    async getCustomerInsights(customerId, options = {}) {
        return insightRepository.getCustomerInsights(customerId, options);
    },

    /**
     * Get latest insight of a specific type
     */
    async getLatestByType(customerId, insightType) {
        return insightRepository.getLatestByType(customerId, insightType);
    },

    /**
     * Get insight statistics
     */
    async getStats() {
        return insightRepository.getStats();
    },
};

export default insightService;
