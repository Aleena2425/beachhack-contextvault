/**
 * Search Service
 * Hybrid search combining PostgreSQL (recent) and ChromaDB (similar)
 */

import * as messageRepository from '../data/postgres/repositories/messageRepository.js';
import * as conversationVectorRepository from '../data/vector/conversationVectorRepository.js';
import logger from '../utils/logger.js';

/**
 * Get relevant context using hybrid search
 * Combines recent messages (SQL) with semantically similar messages (vector)
 */
export async function getRelevantContext(customerId, sessionId, currentMessage, limit = 10) {
    try {
        // 1. Get recent messages from PostgreSQL (last 5 from current session)
        const recentMessages = await messageRepository.getBySession(sessionId, 5);

        // 2. Get semantically similar messages from ChromaDB (top 5 from this customer)
        const similarMessages = await conversationVectorRepository.searchSimilarMessages(
            currentMessage,
            5,
            { customer_id: customerId }
        );

        // 3. Combine results
        const combined = [
            ...recentMessages.map(m => ({
                source: 'recent',
                content: m.content,
                sender_type: m.sender_type,
                created_at: m.created_at,
                sentiment: m.sentiment,
                intent: m.intent
            })),
            ...similarMessages.map(m => ({
                source: 'similar',
                content: m.content,
                sentiment: m.sentiment,
                intent: m.intent,
                similarity: m.similarity
            }))
        ];

        // 4. Deduplicate by content
        const unique = deduplicateByContent(combined);

        // 5. Sort: recent first, then by similarity
        const sorted = unique.sort((a, b) => {
            if (a.source === 'recent' && b.source !== 'recent') return -1;
            if (a.source !== 'recent' && b.source === 'recent') return 1;
            if (a.similarity && b.similarity) return a.similarity - b.similarity;
            return 0;
        });

        logger.debug('Hybrid search completed', {
            customerId,
            recentCount: recentMessages.length,
            similarCount: similarMessages.length,
            uniqueCount: unique.length
        });

        return sorted.slice(0, limit);

    } catch (error) {
        logger.error('Hybrid search failed', { error: error.message });
        // Fallback to just recent messages
        try {
            const fallback = await messageRepository.getBySession(sessionId, limit);
            return fallback.map(m => ({
                source: 'recent',
                content: m.content,
                sender_type: m.sender_type
            }));
        } catch (fallbackError) {
            logger.error('Fallback search also failed', { error: fallbackError.message });
            return [];
        }
    }
}

/**
 * Deduplicate messages by content
 */
function deduplicateByContent(messages) {
    const seen = new Set();
    return messages.filter(msg => {
        const normalized = msg.content.trim().toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
    });
}

export default {
    getRelevantContext
};
