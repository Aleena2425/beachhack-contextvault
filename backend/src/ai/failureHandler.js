/**
 * RAG Failure Handler
 * Graceful degradation for AI pipeline failures
 */

import customerRepository from '../data/postgres/repositories/customerRepository.js';
import { intelligentCache } from './cache.js';
import logger from '../utils/logger.js';

export class RAGFailureHandler {
    /**
     * Handle RAG pipeline failure
     */
    async handle(error, customerId, message) {
        logger.error('RAG pipeline failed', {
            error: error.message,
            code: error.code,
            customerId,
        });

        // Determine failure type and handle accordingly
        if (error.code === 'EMBEDDING_FAILED') {
            return await this.handleEmbeddingFailure(customerId, message);
        }

        if (error.code === 'VECTOR_SEARCH_FAILED') {
            return await this.handleVectorSearchFailure(customerId, message);
        }

        if (error.code === 'GEMINI_TIMEOUT' || error.code === 'GEMINI_FAILED') {
            return await this.handleGeminiFailure(customerId, message);
        }

        // Default fallback
        return await this.fallbackInsight(customerId, message);
    }

    /**
     * Normalize fallback shape for Gemini insight (extractedPreferences, suggestedResponses).
     */
    normalizeFallback(insight) {
        return {
            summary: insight.summary ?? 'Message received. Manual review recommended.',
            intent: insight.intent ?? 'unknown',
            urgency: insight.urgency ?? 'medium',
            sentiment: insight.sentiment ?? 'neutral',
            recommendations: insight.recommendations ?? [],
            extractedPreferences: insight.extractedPreferences ?? insight.preferences ?? {},
            suggestedResponses: insight.suggestedResponses ?? [],
            fallback: insight.fallback ?? true,
            fallbackReason: insight.fallbackReason,
        };
    }

    /**
     * Handle embedding service failure
     */
    async handleEmbeddingFailure(customerId, message) {
        logger.warn('Embedding service down, using structured data only', {
            customerId,
        });

        try {
            // Skip vector search, use only structured profile
            const profile = await customerRepository.findById(customerId);

            return this.normalizeFallback({
                intent: 'unknown',
                urgency: 'medium',
                sentiment: 'neutral',
                summary: `Customer ${profile?.name || 'Unknown'} sent a message. Vector search unavailable - manual review recommended.`,
                recommendations: [
                    'Review message manually',
                    'Check customer history in database',
                ],
                fallback: true,
                fallbackReason: 'embedding_service_down',
            });
        } catch (err) {
            return this.fallbackInsight(customerId, message);
        }
    }

    /**
     * Handle vector search failure
     */
    async handleVectorSearchFailure(customerId, message) {
        logger.warn('Vector DB unavailable, using rule-based analysis', {
            customerId,
        });

        try {
            const profile = await customerRepository.findById(customerId);
            const intent = this.detectIntentRuleBased(message.content);
            const urgency = this.detectUrgency(message.content);

            return this.normalizeFallback({
                intent,
                urgency,
                sentiment: 'neutral',
                summary: `${profile?.name || 'Customer'} - ${intent}. Historical context unavailable.`,
                recommendations: this.getRuleBasedRecommendations(intent),
                fallback: true,
                fallbackReason: 'vector_db_unavailable',
            });
        } catch (err) {
            return this.fallbackInsight(customerId, message);
        }
    }

    /**
     * Handle Gemini failure (timeout or error)
     */
    async handleGeminiFailure(customerId, message) {
        logger.warn('Gemini unavailable, checking cache', { customerId });

        // Try to use cached insight
        const cacheKey = `insight:${customerId}:last`;
        const cached = intelligentCache.getInsight(cacheKey);

        if (cached && this.isCacheValid(cached)) {
            logger.info('Using cached insight due to Gemini failure');
            return this.normalizeFallback({
                ...cached,
                summary: `[CACHED] ${cached.summary}`,
                fallback: true,
                fallbackReason: 'gemini_timeout_using_cache',
            });
        }

        await this.queueForAsyncProcessing(customerId, message);
        return this.fallbackInsight(customerId, message);
    }

    /**
     * Default fallback insight
     */
    async fallbackInsight(customerId, message) {
        try {
            const profile = await customerRepository.findById(customerId);
            return this.normalizeFallback({
                intent: 'unknown',
                urgency: 'medium',
                sentiment: 'neutral',
                summary: `Message from ${profile?.name || 'customer'}. AI processing unavailable - please review manually.`,
                recommendations: [
                    'Review message content',
                    'Check customer profile',
                    'Respond based on context',
                ],
                fallback: true,
                fallbackReason: 'complete_ai_failure',
            });
        } catch (err) {
            return this.normalizeFallback({
                intent: 'unknown',
                urgency: 'medium',
                sentiment: 'neutral',
                summary: 'New message received. All AI services unavailable.',
                recommendations: ['Manual review required'],
                fallback: true,
                fallbackReason: 'catastrophic_failure',
            });
        }
    }

    /**
     * Rule-based intent detection (fallback)
     */
    detectIntentRuleBased(content) {
        const lower = content.toLowerCase();

        if (lower.includes('buy') || lower.includes('purchase') || lower.includes('price')) {
            return 'purchase_inquiry';
        }

        if (lower.includes('help') || lower.includes('support') || lower.includes('problem')) {
            return 'support_request';
        }

        if (lower.includes('cancel') || lower.includes('refund') || lower.includes('complaint')) {
            return 'complaint';
        }

        if (lower.includes('question') || lower.includes('how') || lower.includes('what')) {
            return 'information_request';
        }

        return 'general_inquiry';
    }

    /**
     * Rule-based urgency detection
     */
    detectUrgency(content) {
        const lower = content.toLowerCase();

        const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
        const highKeywords = ['soon', 'quickly', 'important'];

        if (urgentKeywords.some(kw => lower.includes(kw))) {
            return 'critical';
        }

        if (highKeywords.some(kw => lower.includes(kw))) {
            return 'high';
        }

        return 'medium';
    }

    /**
     * Get rule-based recommendations
     */
    getRuleBasedRecommendations(intent) {
        const recommendations = {
            purchase_inquiry: [
                'Provide pricing information',
                'Highlight current promotions',
                'Offer product comparison',
            ],
            support_request: [
                'Acknowledge the issue',
                'Gather more details',
                'Escalate if needed',
            ],
            complaint: [
                'Apologize for inconvenience',
                'Investigate the issue',
                'Offer resolution options',
            ],
            information_request: [
                'Provide clear answers',
                'Share relevant documentation',
                'Offer additional assistance',
            ],
            general_inquiry: [
                'Understand customer needs',
                'Provide helpful information',
                'Build rapport',
            ],
        };

        return recommendations[intent] || ['Respond appropriately', 'Be helpful'];
    }

    /**
     * Check if cached insight is still valid
     */
    isCacheValid(cached) {
        if (!cached || !cached.timestamp) return false;

        const ageMs = Date.now() - new Date(cached.timestamp).getTime();
        const maxAgeMs = 10 * 60 * 1000; // 10 minutes

        return ageMs < maxAgeMs;
    }

    /**
     * Queue message for async processing
     */
    async queueForAsyncProcessing(customerId, message) {
        // In production, this would add to a job queue (e.g., Bull, BullMQ)
        logger.info('Queued for async processing', {
            customerId,
            messageId: message.id,
        });

        // For now, just log
        // TODO: Implement actual queue
    }
}

export const ragFailureHandler = new RAGFailureHandler();

export default ragFailureHandler;
