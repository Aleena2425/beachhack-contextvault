/**
 * Production-Grade RAG Pipeline
 * Enhanced with caching, hybrid retrieval, failure handling, and performance monitoring
 */

import { embeddingQueue } from './embeddingQueue.js';
import { hybridRetriever } from './hybridRetriever.js';
import { contextMerger } from './contextMerger.js';
import { incrementalSummarizer } from './incrementalSummarizer.js';
import { ragFailureHandler } from './failureHandler.js';
import { intelligentCache } from './cache.js';
import { addInteraction } from '../data/vector/collections.js';
// import { retrieveMemory, prepareContextForGemini } from './memoryRetriever.js'; // Not used, using hybridRetriever instead
import customerRepository from '../data/postgres/repositories/customerRepository.js';
import sessionRepository from '../data/postgres/repositories/sessionRepository.js';
import { buildInsightPrompt, buildReturningCustomerPrompt } from './promptBuilder.js';
import { generateInsight, generateReturningCustomerSummary } from './geminiProcessor.js';
import { updateProfile } from './profileAccumulator.js';
import logger from '../utils/logger.js';

/**
 * Production-Grade RAG Pipeline
 */
export const ragPipeline = {
    /**
     * Execute complete RAG pipeline for message insight
     */
    async executeRAGPipeline(customerId, sessionId, message, senderType = 'customer') {
        const startTime = Date.now();
        const metrics = {
            embeddingTime: 0,
            retrievalTime: 0,
            contextMergeTime: 0,
            geminiTime: 0,
            storageTime: 0,
            totalTime: 0,
        };

        try {
            logger.info('  ├─ [STEP 5.1.1] Generating message embedding...');

            // STEP 1: Embed incoming message (with queue and cache)
            const embeddingStart = Date.now();
            const messageEmbedding = await embeddingQueue.add(
                { id: message.id || 'temp', content: message.content || message },
                'urgent' // Customer messages are urgent
            );
            metrics.embeddingTime = Date.now() - embeddingStart;

            logger.info('  ├─ [STEP 5.1.2] Embedding generated', {
                dimensions: messageEmbedding?.length || 0,
                time_ms: metrics.embeddingTime,
                cached: messageEmbedding?._cached || false,
            });

            logger.info('  ├─ [STEP 5.1.3] Retrieving context from multiple sources...');

            // STEP 2: Retrieve relevant context
            const retrievalStart = Date.now();
            const [hybridResults, structuredProfile, sessionContext] = await Promise.all([
                hybridRetriever.retrieve(customerId, message.content || message, {
                    topK: 5,
                    intent: null,
                }),
                this.getStructuredProfile(customerId),
                this.getCurrentSessionContext(sessionId),
            ]);
            metrics.retrievalTime = Date.now() - retrievalStart;

            logger.info('  ├─ [STEP 5.1.4] Context retrieved', {
                hybrid_results: hybridResults?.merged?.length || 0,
                profile_loaded: !!structuredProfile,
                session_messages: sessionContext?.messages?.length || 0,
                time_ms: metrics.retrievalTime,
            });

            logger.info('  ├─ [STEP 5.1.5] Merging and deduplicating context...');

            // STEP 3: Merge context intelligently
            const mergeStart = Date.now();
            const mergedContext = contextMerger.merge(
                structuredProfile,
                hybridResults?.merged || [],
                sessionContext,
                { maxTokens: 2000 }
            );
            metrics.contextMergeTime = Date.now() - mergeStart;

            logger.info('  ├─ [STEP 5.1.6] Context merged', {
                total_tokens: mergedContext?.metadata?.totalTokens || 0,
                deduplication_applied: true,
                time_ms: metrics.contextMergeTime,
            });

            logger.info('  ├─ [STEP 5.2.1] Building prompt for Gemini Pro...');

            // STEP 4: Build prompt
            const prompt = buildInsightPrompt({
                customerProfile: mergedContext.customer,
                relevantInteractions: mergedContext.relevant_history,

                currentMessage: message.content || message,
                sessionHistory: sessionContext.messages || [],
                senderType,
            });

            logger.info('  ├─ [STEP 5.2.2] Generating insight with Gemini Pro...');

            // STEP 5: Generate insight with Gemini
            const geminiStart = Date.now();
            const insight = await generateInsight(prompt);
            metrics.geminiTime = Date.now() - geminiStart;

            logger.info('  ├─ [STEP 5.2.3] Gemini insight generated', {
                intent: insight?.intent,
                urgency: insight?.urgency,
                sentiment: insight?.sentiment,
                confidence: insight?.confidence,
                time_ms: metrics.geminiTime,
            });

            // Parse insight (handle both JSON and text responses)
            const parsed = typeof insight === 'string'
                ? this.parseInsightResponse(insight)
                : insight;

            // STEP 6: Store message embedding in customer vector namespace (async, non-blocking)
            const storageStart = Date.now();
            if (senderType === 'customer') {
                this.storeMessageEmbeddingAsync(customerId, {
                    id: message.id ? `msg_${message.id}` : `temp_${Date.now()}`,
                    embedding: messageEmbedding,
                    document: message.content || message,
                    customerId,
                    sessionId,
                    timestamp: new Date().toISOString(),
                    senderType,
                    intent: parsed.intent,
                });
            }
            metrics.storageTime = Date.now() - storageStart;

            // STEP 7: Update structured profile incrementally
            await updateProfile(customerId, {
                preferences: parsed.preferences || {},
                intent: parsed.intent,
                lastInteraction: new Date(),
            });

            // STEP 8: Update summary if needed (async)
            this.updateSummaryAsync(customerId, parsed);

            // Calculate total time
            metrics.totalTime = Date.now() - startTime;

            // Log performance metrics
            this.logMetrics(customerId, metrics);

            return {
                ...parsed,
                processingTime: metrics.totalTime,
                memoryStats: {
                    vectorResults: mergedMemory.length,
                    contextTokens: contextMerger.estimateTokens(mergedContext.relevant_history),
                    cacheStats: intelligentCache.getStats(),
                },
            };

        } catch (error) {
            logger.error('RAG pipeline failed', { error: error.message, customerId });

            // Graceful degradation
            return await ragFailureHandler.handle(error, customerId, message);
        }
    },

    /**
     * Generate summary for returning customer
     */
    async generateReturningCustomerInsight(customerId) {
        const startTime = Date.now();

        try {
            // Check cache first
            const cacheKey = `returning:${customerId}`;
            const cached = intelligentCache.getInsight(cacheKey);
            if (cached) {
                logger.debug('Returning customer insight cache hit', { customerId });
                return cached;
            }

            // Get customer profile (with cache)
            const customerProfile = intelligentCache.getProfile(customerId) ||
                await customerRepository.getProfile(customerId);

            if (!customerProfile) {
                throw new Error(`Customer not found: ${customerId}`);
            }

            // Cache profile
            intelligentCache.setProfile(customerId, customerProfile);

            // Get recent sessions
            const recentSessions = await sessionRepository.getCustomerSessions(customerId, 5);

            // Retrieve memory via LangChain for returning customer context
            const { relevantInteractions } = await prepareContextForGemini(
                customerId,
                `${customerProfile.name || 'customer'} history`,
                { k: 5, sessionMessages: [] }
            );

            // Build prompt for Gemini Pro
            const prompt = buildReturningCustomerPrompt({
                customerProfile,
                recentSessions,
                relevantInteractions,
            });

            // Generate summary
            const summary = await generateReturningCustomerSummary(prompt);

            const totalTime = Date.now() - startTime;
            logger.info('Generated returning customer insight', { customerId, totalTime });

            const result = {
                ...summary,
                profile: {
                    name: customerProfile.name,
                    email: customerProfile.email,
                    totalSessions: customerProfile.total_sessions,
                    lastSeen: customerProfile.last_seen,
                    preferences: customerProfile.preferences,
                    tags: customerProfile.tags,
                },
                totalProcessingTime: totalTime,
            };

            // Cache result
            intelligentCache.setInsight(cacheKey, result);

            return result;

        } catch (error) {
            logger.error('Returning customer insight failed', { error: error.message });
            return await ragFailureHandler.handle(error, customerId, {});
        }
    },

    /**
     * Get structured profile with caching
     */
    async getStructuredProfile(customerId) {
        const cached = intelligentCache.getProfile(customerId);
        if (cached) return cached;

        const profile = await customerRepository.getProfile(customerId);
        intelligentCache.setProfile(customerId, profile);

        return profile;
    },

    /**
     * Get current session context (messages for Gemini prompt).
     */
    async getCurrentSessionContext(sessionId) {
        if (!sessionId) return { messages: [], intent: null };

        const session = await sessionRepository.findById(sessionId);
        const messageRepository = (await import('../data/postgres/repositories/messageRepository.js')).default;
        const messages = await messageRepository.getSessionMessages(sessionId, { limit: 50 });
        return {
            sessionId,
            status: session?.status,
            intent: session?.detected_intent,
            messages: messages.map((m) => ({ sender_type: m.sender_type, content: m.content })),
        };
    },

    /**
     * Store message embedding in customer vector namespace (per-customer collection).
     */
    async storeMessageEmbeddingAsync(customerId, data) {
        try {
            await addInteraction(data);
            logger.debug('Stored message embedding', { id: data.id, customerId });
        } catch (error) {
            logger.error('Failed to store embedding', { error: error.message, id: data?.id });
            // Non-critical, don't throw
        }
    },

    /**
     * Update customer summary asynchronously
     */
    async updateSummaryAsync(customerId, insight) {
        try {
            await incrementalSummarizer.updateCustomerSummary(customerId, insight);

            // Invalidate profile cache
            intelligentCache.invalidateProfile(customerId);
        } catch (error) {
            logger.error('Failed to update summary', { error: error.message, customerId });
            // Non-critical, don't throw
        }
    },

    /**
     * Parse insight response (handle both JSON and text)
     */
    parseInsightResponse(response) {
        try {
            // Try to parse as JSON
            return JSON.parse(response);
        } catch (e) {
            // Fallback: extract from text
            return {
                intent: 'unknown',
                urgency: 'medium',
                sentiment: 'neutral',
                summary: response,
                recommendations: [],
                preferences: {},
            };
        }
    },

    /**
     * Log performance metrics
     */
    logMetrics(customerId, metrics) {
        logger.info('RAG Pipeline Metrics', {
            customerId,
            embedding: `${metrics.embeddingTime}ms`,
            retrieval: `${metrics.retrievalTime}ms`,
            contextMerge: `${metrics.contextMergeTime}ms`,
            gemini: `${metrics.geminiTime}ms`,
            storage: `${metrics.storageTime}ms`,
            total: `${metrics.totalTime}ms`,
        });

        // Alert if slow
        if (metrics.totalTime > 2000) {
            logger.warn('RAG pipeline slow', { customerId, totalTime: metrics.totalTime });
        }
    },
};

export default ragPipeline;
