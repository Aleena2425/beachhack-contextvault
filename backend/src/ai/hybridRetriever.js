/**
 * Hybrid Retrieval System
 * Combines recent, semantic, and intent-based retrieval
 */

import { querySimilarInteractions } from '../data/vector/collections.js';
import messageRepository from '../data/postgres/repositories/messageRepository.js';
import { embeddingQueue } from './embeddingQueue.js';
import { intelligentCache } from './cache.js';
import logger from '../utils/logger.js';

export class HybridRetriever {
    /**
     * Retrieve context using hybrid strategy
     */
    async retrieve(customerId, currentMessage, options = {}) {
        const {
            topK = 5,
            includeRecent = true,
            includeSemantic = true,
            includeIntentBased = true,
            intent = null,
        } = options;

        const results = {};

        try {
            // Stage 1: Recent context (last 10 messages)
            if (includeRecent) {
                results.recent = await this.getRecentMessages(customerId, 10);
            }

            // Stage 2: Semantic similarity
            if (includeSemantic) {
                results.semantic = await this.getSemanticSimilar(
                    customerId,
                    currentMessage,
                    topK
                );
            }

            // Stage 3: Intent-based (if intent detected)
            if (includeIntentBased && intent) {
                results.intentBased = await this.getIntentBased(
                    customerId,
                    currentMessage,
                    intent,
                    Math.ceil(topK / 2)
                );
            }

            // Merge and deduplicate
            results.merged = this.mergeResults(results);

            logger.debug('Hybrid retrieval completed', {
                customerId,
                recent: results.recent?.length || 0,
                semantic: results.semantic?.length || 0,
                intentBased: results.intentBased?.length || 0,
                merged: results.merged?.length || 0,
            });

            return results;
        } catch (error) {
            logger.error('Hybrid retrieval failed', {
                error: error.message,
                customerId,
            });

            // Return partial results
            return results;
        }
    }

    /**
     * Get recent messages for customer
     */
    async getRecentMessages(customerId, limit = 10) {
        try {
            const messages = await messageRepository.getCustomerMessages(
                customerId,
                limit
            );

            return messages.map(m => ({
                document: m.content,
                metadata: {
                    message_id: m.id,
                    session_id: m.session_id,
                    timestamp: m.sent_at,
                    sender_type: m.sender_type,
                    source: 'recent',
                },
                score: 1.0, // Recent messages get max score
            }));
        } catch (error) {
            logger.warn('Failed to get recent messages', { error: error.message });
            return [];
        }
    }

    /**
     * Get semantically similar messages
     */
    async getSemanticSimilar(customerId, message, topK = 5) {
        try {
            // Check cache
            const cacheKey = `${customerId}:${message.substring(0, 50)}`;
            const cached = intelligentCache.getVectorSearch(cacheKey);
            if (cached) {
                logger.debug('Vector search cache hit');
                return cached;
            }

            // Generate embedding (with queue)
            const embedding = await embeddingQueue.add(
                { id: 'query', content: message },
                'urgent' // Queries are urgent
            );

            // Search vector DB
            const results = await querySimilarInteractions(
                embedding,
                customerId,
                topK
            );

            // Add source metadata
            const enriched = results.map(r => ({
                ...r,
                metadata: {
                    ...r.metadata,
                    source: 'semantic',
                },
            }));

            // Cache results
            intelligentCache.setVectorSearch(cacheKey, enriched);

            return enriched;
        } catch (error) {
            logger.warn('Semantic search failed', { error: error.message });
            return [];
        }
    }

    /**
     * Get intent-based messages
     */
    async getIntentBased(customerId, message, intent, topK = 3) {
        try {
            // Generate embedding
            const embedding = await embeddingQueue.add(
                { id: 'query_intent', content: message },
                'urgent'
            );

            // Search with intent filter
            const results = await querySimilarInteractions(
                embedding,
                customerId,
                topK,
                { intent } // Filter by intent
            );

            return results.map(r => ({
                ...r,
                metadata: {
                    ...r.metadata,
                    source: 'intent_based',
                },
            }));
        } catch (error) {
            logger.warn('Intent-based search failed', { error: error.message });
            return [];
        }
    }

    /**
     * Merge and deduplicate results
     */
    mergeResults(results) {
        const all = [
            ...(results.recent || []),
            ...(results.semantic || []),
            ...(results.intentBased || []),
        ];

        // Deduplicate by message_id
        const seen = new Set();
        const unique = [];

        for (const item of all) {
            const id = item.metadata?.message_id || item.document;
            if (!seen.has(id)) {
                seen.add(id);
                unique.push(item);
            }
        }

        // Sort by score (descending)
        unique.sort((a, b) => (b.score || 0) - (a.score || 0));

        // Return top 10
        return unique.slice(0, 10);
    }
}

export const hybridRetriever = new HybridRetriever();

export default hybridRetriever;
