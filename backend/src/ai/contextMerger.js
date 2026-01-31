/**
 * Context Merger
 * Merges structured profile, vector memories, and session context
 */

import logger from '../utils/logger.js';

export class ContextMerger {
    /**
     * Merge all context sources
     */
    merge(structuredProfile, vectorMemories, sessionContext, options = {}) {
        const { maxTokens = 2000 } = options;

        // 1. Deduplicate information
        const deduped = this.deduplicateInfo(vectorMemories);

        // 2. Order by relevance
        const ordered = this.orderByRelevance(deduped, sessionContext);

        // 3. Summarize if too long
        const summarized = this.summarizeIfNeeded(ordered, { maxTokens });

        // 4. Merge with structured data
        return {
            customer: {
                ...structuredProfile,
                communication_style: this.inferStyle(vectorMemories),
            },
            relevant_history: summarized,
            current_context: sessionContext,
            metadata: {
                total_memories: vectorMemories.length,
                deduped_count: deduped.length,
                time_span: this.calculateTimeSpan(vectorMemories),
            },
        };
    }

    /**
     * Remove near-duplicate messages
     */
    deduplicateInfo(memories) {
        if (!memories || memories.length === 0) return [];

        const unique = [];

        for (const mem of memories) {
            // Check if similar message already exists
            const isDuplicate = unique.some(u => {
                // Simple text similarity check
                return this.textSimilarity(mem.document, u.document) > 0.9;
            });

            if (!isDuplicate) {
                unique.push(mem);
            }
        }

        logger.debug('Deduplicated memories', {
            original: memories.length,
            unique: unique.length,
        });

        return unique;
    }

    /**
     * Order memories by relevance score
     */
    orderByRelevance(memories, currentContext) {
        return memories
            .map(m => ({
                ...m,
                relevanceScore: this.calculateRelevanceScore(m, currentContext),
            }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Calculate relevance score (recency + semantic + intent match)
     */
    calculateRelevanceScore(memory, context) {
        const recencyScore = this.getRecencyScore(memory.metadata?.timestamp);
        const semanticScore = memory.score || 0.5;
        const intentMatch = memory.metadata?.intent === context?.intent ? 0.2 : 0;

        return (recencyScore * 0.3) + (semanticScore * 0.5) + intentMatch;
    }

    /**
     * Get recency score (exponential decay)
     */
    getRecencyScore(timestamp) {
        if (!timestamp) return 0;

        const now = Date.now();
        const messageTime = new Date(timestamp).getTime();
        const ageMs = now - messageTime;

        // Exponential decay: half-life of 7 days
        const halfLifeMs = 7 * 24 * 60 * 60 * 1000;
        return Math.exp(-ageMs / halfLifeMs);
    }

    /**
     * Summarize if context exceeds token limit
     */
    summarizeIfNeeded(memories, options) {
        const totalTokens = this.estimateTokens(memories);

        if (totalTokens <= options.maxTokens) {
            return memories;
        }

        // Keep recent messages as-is, summarize older ones
        const recent = memories.slice(0, 5);
        const older = memories.slice(5);

        logger.info('Summarizing older memories', {
            total: memories.length,
            recent: recent.length,
            older: older.length,
        });

        // For now, just truncate (in production, use LLM to summarize)
        return [...recent, ...older.slice(0, 5)];
    }

    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(memories) {
        const totalChars = memories.reduce((sum, m) => {
            return sum + (m.document?.length || 0);
        }, 0);

        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(totalChars / 4);
    }

    /**
     * Calculate time span of memories
     */
    calculateTimeSpan(memories) {
        if (!memories || memories.length === 0) return null;

        const timestamps = memories
            .map(m => m.metadata?.timestamp)
            .filter(t => t)
            .map(t => new Date(t).getTime());

        if (timestamps.length === 0) return null;

        const oldest = Math.min(...timestamps);
        const newest = Math.max(...timestamps);

        const spanMs = newest - oldest;
        const spanDays = Math.floor(spanMs / (24 * 60 * 60 * 1000));

        return {
            oldest: new Date(oldest).toISOString(),
            newest: new Date(newest).toISOString(),
            spanDays,
        };
    }

    /**
     * Infer communication style from memories
     */
    inferStyle(memories) {
        if (!memories || memories.length === 0) return 'unknown';

        // Simple heuristic based on message length
        const avgLength = memories.reduce((sum, m) => {
            return sum + (m.document?.length || 0);
        }, 0) / memories.length;

        if (avgLength < 50) return 'concise';
        if (avgLength < 150) return 'moderate';
        return 'detailed';
    }

    /**
     * Simple text similarity (Jaccard index)
     */
    textSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));

        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }
}

export const contextMerger = new ContextMerger();

export default contextMerger;
