/**
 * AI Processing Pipeline
 * Processes messages with Gemini AI and generates insights
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import * as messageRepository from '../data/postgres/repositories/messageRepository.js';
import * as insightRepository from '../data/postgres/repositories/insightRepository.js';
import * as profileRepository from '../data/postgres/repositories/profileRepository.js';
import * as agentSocket from '../realtime/agentSocket.js';
import * as conversationVectorRepository from '../data/vector/conversationVectorRepository.js';
import * as searchService from '../services/searchService.js';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Process a message through the AI pipeline
 */
export async function processMessage(customer, session, message, sender) {
    try {
        // Only process customer messages
        if (sender !== 'customer') {
            logger.debug('Skipping AI processing for agent message');
            return;
        }

        logger.info('AI Pipeline started', {
            customerId: customer.id,
            sessionId: session.id,
            sender
        });

        // Store message embedding in ChromaDB (async, don't wait)
        conversationVectorRepository.storeMessageEmbedding(message, customer, session)
            .then(success => {
                if (success) {
                    logger.info('✅ Embedding stored successfully', {
                        messageId: message.id,
                        customerId: customer.id
                    });
                } else {
                    logger.warn('⚠️ Embedding storage returned false', {
                        messageId: message.id
                    });
                }
            })
            .catch(error => {
                logger.error('❌ Failed to store embedding', {
                    messageId: message.id,
                    error: error.message,
                    stack: error.stack
                });
            });

        // Get hybrid context: recent (SQL) + similar (vector)
        const context = await searchService.getRelevantContext(
            customer.id,
            session.id,
            message.content,
            10
        );

        // Build conversation context from hybrid results
        const conversationHistory = context
            .map(msg => {
                const prefix = msg.source === 'similar' ? '[SIMILAR] ' : '';
                const sender = msg.sender_type || 'customer';
                return `${prefix}${sender}: ${msg.content}`;
            })
            .join('\n');

        // Build Gemini prompt
        const prompt = `You are analyzing a customer support conversation. Provide insights for the agent.

Conversation history:
${conversationHistory}

Latest customer message: ${message.content}

Provide analysis as JSON with this exact structure:
{
  "intent": "question|complaint|feedback|request|greeting|other",
  "urgency": "low|medium|high",
  "summary": "brief one-sentence summary of customer's need",
  "suggestions": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3"]
}

Be concise and actionable. Focus on helping the agent respond effectively.`;

        logger.debug('Calling Gemini API...', {
            customerId: customer.id,
            historyLength: conversationHistory.length
        });

        const startTime = Date.now();

        // Call Gemini API
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const duration = Date.now() - startTime;
        logger.info('Gemini API response received', {
            customerId: customer.id,
            duration: `${duration}ms`
        });

        // Parse JSON response
        let insights;
        try {
            // Extract JSON from response (Gemini sometimes wraps it in markdown)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            insights = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            logger.error('Failed to parse Gemini response', {
                error: parseError.message,
                response: response.substring(0, 200)
            });

            // Fallback insights
            insights = {
                intent: 'question',
                urgency: 'medium',
                summary: 'Customer needs assistance',
                suggestions: [
                    'Ask for more details',
                    'Verify customer information',
                    'Provide relevant resources'
                ]
            };
        }

        logger.debug('Insights parsed', {
            customerId: customer.id,
            intent: insights.intent,
            urgency: insights.urgency
        });

        // Update message with AI metadata
        await messageRepository.updateAIMetadata(
            message.id,
            insights.intent
        );

        // Store insights in database
        const storedInsight = await insightRepository.create(
            customer.id,
            session.id,
            message.id,
            insights
        );

        // Update customer profile incrementally
        await profileRepository.updateWithInsight(customer.id, insights);

        // Emit to agents via Socket.io with the format expected by AgentDash.jsx
        // 1. Context Update (Budget, Interest, Summary)
        agentSocket.emitContextUpdate(customer.external_id, {
            summary: insights.summary,
            budget: insights.budget || insights.budget_max || 'Unknown',
            interest: insights.interest || insights.product_interest || 'General'
        });

        // 2. Next Best Actions (Suggestions, Intent, Urgency)
        agentSocket.emitNextAction(customer.external_id, {
            suggestions: insights.suggestions,
            intent: insights.intent,
            urgency: insights.urgency
        });

        logger.info('AI Pipeline completed', {
            customerId: customer.id,
            totalDuration: `${Date.now() - startTime}ms`
        });

        return storedInsight;

    } catch (error) {
        logger.error('AI Pipeline failed', {
            customerId: customer?.id,
            error: error.message,
            stack: error.stack
        });

        // Don't throw - fail gracefully
        // Chat continues to work even if AI fails
    }
}

export default {
    processMessage
};
