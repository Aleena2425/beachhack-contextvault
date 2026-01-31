/**
 * Message Service
 * Business logic for chat message operations with AI processing
 */

import messageRepository from '../data/postgres/repositories/messageRepository.js';
import sessionRepository from '../data/postgres/repositories/sessionRepository.js';
import agentRepository from '../data/postgres/repositories/agentRepository.js';
import insightRepository from '../data/postgres/repositories/insightRepository.js';
import ragPipeline from '../ai/ragPipeline.js';
import profileAccumulator from '../ai/profileAccumulator.js';
import { ragFailureHandler } from '../ai/failureHandler.js';
import { pushInsightToAgent, pushAnalysisUpdate } from '../realtime/socketManager.js';
import logger from '../utils/logger.js';

export const messageService = {
    /**
     * Process an incoming message from the dummy website
     * This is the main entry point for message handling
     */
    async createMessage(data) {
        const { sessionId, sender, content } = data;

        logger.info('📨 [STEP 2] Message received by ContextAI', {
            session_id: sessionId,
            sender,
            content_length: content.length,
        });

        // Validate session exists
        const session = await sessionRepository.findById(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // Determine sender info
        const senderType = sender; // 'customer' or 'agent'
        const senderId = senderType === 'customer' ? session.customer_id : session.agent_id;

        // Create message
        const message = await messageRepository.create({
            sessionId,
            senderType: sender,
            content,
        });

        logger.info('✅ [STEP 3] Message stored in PostgreSQL', {
            message_id: message.id,
            session_id: sessionId,
            table: 'messages',
            timestamp: message.created_at,
        });

        logger.debug('Message stored', { messageId: message.id, sessionId: sessionId });

        // Only process customer messages through AI pipeline
        if (senderType === 'customer' && session.agent_id) {
            // Process asynchronously to not block response
            this.processMessageWithAI(message, session).catch(error => {
                logger.error('AI processing failed', { error: error.message, messageId: message.id });
            });
        }

        return message;
    },

    /**
     * Stores message embedding in the vector database.
     */
    async storeMessageEmbedding(message, embedding, session) {
        await embeddingRepository.addEmbedding({
            id: message.id,
            vector: embedding,
            metadata: {
                message_id: message.id,
                session_id: session.id,
                customer_id: session.customer_id,
                sender_type: message.sender_type,
                content: message.content,
                created_at: message.created_at,
            },
        });
    },

    /**
     * Process message through AI pipeline
     * Runs asynchronously after message is stored
     */
    async processMessageWithAI(message, session) {
        const startTime = Date.now();

        let insight;
        try {
            logger.info('🤖 [STEP 5] AI Pipeline initiated', {
                message_id: message.id,
                customer_id: session.customer_id,
                session_id: session.id,
            });

            // Execute RAG pipeline
            logger.info('🔍 [STEP 5.1] RAG Pipeline: Retrieving context...');
            insight = await ragPipeline.executeRAGPipeline(
                session.customer_id,
                session.id,
                message, // Pass the full message object
                message.sender_type
            );

            logger.info('✅ [STEP 5.2] AI insight generated', {
                type: insight.type,
                intent: insight.intent,
                urgency: insight.urgency,
                confidence: insight.confidence,
            });
        } catch (error) {
            logger.error('AI pipeline failed, applying fallback', {
                error: error.message,
                messageId: message.id,
            });
            insight = await ragFailureHandler.handle(
                error,
                session.customer_id,
                message
            );
        }

        // Store message embedding if available
        if (insight.embedding) {
            logger.info('🔢 [STEP 4] Storing embedding in ChromaDB...');
            try {
                await this.storeMessageEmbedding(message, insight.embedding, session);
                logger.info('✅ [STEP 4] Embedding stored in vector database', {
                    collection: 'customer_interactions',
                    dimensions: insight.embedding.length,
                });
            } catch (err) {
                logger.warn('Failed to store message embedding', { error: err.message, messageId: message.id });
            }
        }


        const prefs = insight.extractedPreferences ?? insight.preferences ?? {};
        const suggestions = insight.suggestedResponses ?? [];

        try {
            await sessionRepository.updateWithAIData(session.id, {
                intent: insight.intent,
                urgency: insight.urgency,
                sentiment: insight.sentiment,
            });
        } catch (err) {
            logger.warn('Failed to update session with AI data', { error: err.message });
        }

        if (Object.keys(prefs).length > 0) {
            try {
                await profileAccumulator.updateFromInsight(session.customer_id, {
                    preferences: prefs,
                    intent: insight.intent,
                    sessionId: session.id,
                });
            } catch (err) {
                logger.warn('Failed to update profile from insight', { error: err.message });
            }
        }

        try {
            await insightRepository.create({
                sessionId: session.id,
                customerId: session.customer_id,
                type: 'message_insight',
                content: JSON.stringify(insight),
                confidenceScore: insight.fallback ? 0.5 : 0.85,
                modelVersion: insight.fallback ? 'fallback' : 'gemini-2.0-flash',
                processingTimeMs: Date.now() - startTime,
            });
        } catch (err) {
            logger.warn('Failed to store insight', { error: err.message });
        }

        if (session.agent_id) {
            try {
                const agent = await agentRepository.findById(session.agent_id);
                const customer = await customerRepository.findById(session.customer_id); // Fetch customer details
                if (agent) {
                    logger.info('📡 [STEP 6] Pushing insight to agent via Socket.io...', {
                        agent_id: agent.agent_id,
                        namespace: '/agents',
                        event: 'customer:insight',
                    });

                    pushInsightToAgent(agent.agent_id, {
                        customerId: session.customer_id,
                        customerExternalId: customer?.external_id,
                        sessionId: session.id,
                        type: insight.type,
                        summary: insight.summary,
                        profile: insight.profile,
                        recommendations: insight.recommendations,
                        confidence: insight.confidence,
                    });

                    logger.info('✅ [STEP 6.1] Insight emitted to agent', {
                        agent_id: agent.agent_id,
                        room: `agent_${agent.agent_id}`,
                    });

                    pushAnalysisUpdate(agent.agent_id, session.id, {
                        intent: insight.intent,
                        urgency: insight.urgency,
                        sentiment: insight.sentiment,
                        suggestedResponses: suggestions,
                    });
                }
            } catch (err) {
                logger.warn('Failed to push insight to agent', { error: err.message });
            }
        }

        logger.info('AI processing completed', {
            messageId: message.id,
            fallback: !!insight.fallback,
            processingTime: Date.now() - startTime,
        });

        return insight;
    },

    /**
     * Get messages for a session
     */
    async getSessionMessages(sessionId, options = {}) {
        return messageRepository.getSessionMessages(sessionId, options);
    },

    /**
     * Get messages for a customer across all sessions
     */
    async getCustomerMessages(customerId, limit = 50) {
        return messageRepository.getCustomerMessages(customerId, limit);
    },

    /**
     * Get unprocessed messages
     */
    async getUnprocessed(limit = 50) {
        return messageRepository.getUnprocessed(limit);
    },
};

export default messageService;
