/**
 * In-Memory Insight Store
 * Stores AI-generated insights temporarily (no database yet)
 */

import { randomUUID } from 'crypto';
import logger from '../utils/logger.js';

// Map: customerUuid -> Array of insights
const insightStore = new Map();

/**
 * Add an insight to the store
 */
export function addInsight(customerUuid, insightData) {
    const insight = {
        id: randomUUID(),
        customerUuid,
        agentId: insightData.agentId,
        sentiment: insightData.sentiment,
        intent: insightData.intent,
        urgency: insightData.urgency,
        summary: insightData.summary,
        suggestions: insightData.suggestions || [],
        timestamp: new Date()
    };

    if (!insightStore.has(customerUuid)) {
        insightStore.set(customerUuid, []);
    }

    insightStore.get(customerUuid).push(insight);

    logger.debug('Insight stored', {
        customerUuid,
        sentiment: insight.sentiment,
        intent: insight.intent
    });

    return insight;
}

/**
 * Get insights for a customer
 */
export function getInsights(customerUuid, limit = 5) {
    const insights = insightStore.get(customerUuid) || [];
    return insights.slice(-limit); // Get last N insights
}

/**
 * Clear all insights (for testing)
 */
export function clear() {
    insightStore.clear();
    logger.info('Insight store cleared');
}

/**
 * Get stats
 */
export function getStats() {
    let totalInsights = 0;
    insightStore.forEach(insights => {
        totalInsights += insights.length;
    });

    return {
        customers: insightStore.size,
        totalInsights
    };
}

export default {
    addInsight,
    getInsights,
    clear,
    getStats
};
