/**
 * Conversation Vector Repository
 * Stores and searches message embeddings in ChromaDB
 */

import * as chromaClient from './chromaClient.js';
import * as embeddings from '../../ai/embeddings.js';
import logger from '../../utils/logger.js';

const COLLECTION_NAME = 'conversation_messages';

/**
 * Initialize collection
 */
export async function initializeCollection() {
    await chromaClient.getOrCreateCollection(COLLECTION_NAME, {
        description: 'Customer message embeddings for semantic search'
    });
    logger.info('Conversation collection initialized');
}

/**
 * Store message embedding in ChromaDB
 */
export async function storeMessageEmbedding(message, customer, session) {
    try {
        // Generate embedding for message content
        const embedding = await embeddings.generateEmbedding(message.content);

        // Prepare metadata
        const metadata = {
            customer_id: customer.id,
            session_id: session.id,
            content: message.content,
            sentiment: message.sentiment || null,
            intent: message.intent || null,
            timestamp: message.created_at ? message.created_at.toISOString() : new Date().toISOString()
        };

        // Store in ChromaDB
        await chromaClient.addEmbeddings(
            COLLECTION_NAME,
            [message.id],
            [embedding],
            [metadata]
        );

        logger.debug('Message embedding stored', {
            messageId: message.id,
            customerId: customer.id
        });

        return true;

    } catch (error) {
        logger.error('Failed to store message embedding', {
            messageId: message.id,
            error: error.message
        });
        // Don't throw - embedding storage shouldn't break the main flow
        return false;
    }
}

/**
 * Search for similar messages using semantic search
 */
export async function searchSimilarMessages(queryText, limit = 5, filters = {}) {
    try {
        // Generate query embedding
        const queryEmbedding = await embeddings.generateEmbedding(queryText);

        // Build where clause for filtering
        const where = Object.keys(filters).length > 0 ? filters : null;

        // Query ChromaDB
        const results = await chromaClient.queryEmbeddings(
            COLLECTION_NAME,
            [queryEmbedding],
            limit,
            where
        );

        // Format results
        const formattedResults = [];
        if (results.ids && results.ids[0]) {
            for (let i = 0; i < results.ids[0].length; i++) {
                formattedResults.push({
                    id: results.ids[0][i],
                    content: results.metadatas[0][i].content,
                    customer_id: results.metadatas[0][i].customer_id,
                    session_id: results.metadatas[0][i].session_id,
                    sentiment: results.metadatas[0][i].sentiment,
                    intent: results.metadatas[0][i].intent,
                    timestamp: results.metadatas[0][i].timestamp,
                    similarity: results.distances ? results.distances[0][i] : null
                });
            }
        }

        logger.debug('Similar messages found', {
            query: queryText.substring(0, 50),
            resultsCount: formattedResults.length
        });

        return formattedResults;

    } catch (error) {
        logger.error('Semantic search failed', { error: error.message });
        return []; // Return empty array on error
    }
}

/**
 * Get collection statistics
 */
export async function getStats() {
    try {
        const count = await chromaClient.getCollectionCount(COLLECTION_NAME);
        return { count };
    } catch (error) {
        logger.error('Failed to get collection stats', { error: error.message });
        return { count: 0 };
    }
}

export default {
    initializeCollection,
    storeMessageEmbedding,
    searchSimilarMessages,
    getStats
};
