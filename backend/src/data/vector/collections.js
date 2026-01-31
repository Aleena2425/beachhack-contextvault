/**
 * Vector Collections for ContextAI
 * Manages ChromaDB collections: per-customer namespaces for messages, shared for profiles/knowledge.
 */

import { getOrCreateCollection, getOrCreateCustomerCollection } from './chromaClient.js';
import logger from '../../utils/logger.js';

// Collection names
export const COLLECTIONS = {
    CUSTOMER_INTERACTIONS: 'customer_interactions',
    CUSTOMER_PROFILES: 'customer_profiles',
    KNOWLEDGE_BASE: 'knowledge_base',
};

let collections = {};

/**
 * Initialize all collections
 */
export const initCollections = async () => {
    try {
        collections.customerInteractions = await getOrCreateCollection(
            COLLECTIONS.CUSTOMER_INTERACTIONS,
            { description: 'Customer chat messages for semantic search' }
        );

        collections.customerProfiles = await getOrCreateCollection(
            COLLECTIONS.CUSTOMER_PROFILES,
            { description: 'Customer profile summaries for similarity matching' }
        );

        collections.knowledgeBase = await getOrCreateCollection(
            COLLECTIONS.KNOWLEDGE_BASE,
            { description: 'Product and company knowledge for context enrichment' }
        );

        logger.info('All ChromaDB collections initialized');
        return collections;
    } catch (error) {
        logger.error('Failed to initialize collections', { error: error.message });
        throw error;
    }
};

/**
 * Get a specific collection
 */
export const getCollection = (name) => {
    if (!collections[name]) {
        throw new Error(`Collection not initialized: ${name}`);
    }
    return collections[name];
};

/**
 * Add message to customer's vector namespace (one collection per customer).
 * Generates embedding externally; this only stores.
 */
export const addInteraction = async (data) => {
    try {
        const collection = await getOrCreateCustomerCollection(data.customerId);
        await collection.add({
            ids: [data.id],
            embeddings: [data.embedding],
            documents: [data.document],
            metadatas: [{
                customer_id: String(data.customerId),
                session_id: String(data.sessionId ?? ''),
                timestamp: data.timestamp ?? new Date().toISOString(),
                sender_type: data.senderType ?? 'customer',
                intent: (data.intent ?? 'unknown').toString(),
            }],
        });
        logger.debug('Added message to customer vector namespace', { id: data.id, customerId: data.customerId });
        return data.id;
    } catch (error) {
        logger.error('Failed to add interaction', { error: error.message });
        throw error;
    }
};

/**
 * Similarity search within a customer's namespace (per-customer collection).
 * @param {number[]} embedding - Query embedding vector
 * @param {string} customerId - Customer UUID
 * @param {number} n - Max results
 * @returns {Promise<Array<{ document, metadata, distance, score }>>}
 */
export const querySimilarInteractions = async (embedding, customerId, n = 5) => {
    try {
        const collection = await getOrCreateCustomerCollection(customerId);
        const results = await collection.query({
            queryEmbeddings: [embedding],
            nResults: n,
        });
        const docs = results.documents?.[0] ?? [];
        const metadatas = results.metadatas?.[0] ?? [];
        const distances = results.distances?.[0] ?? [];
        return docs.map((doc, i) => {
            const d = distances[i];
            return {
                document: doc,
                metadata: metadatas[i] ?? {},
                distance: d,
                score: typeof d === 'number' ? 1 - Math.min(1, d) : 0.5,
            };
        });
    } catch (error) {
        logger.error('Failed to query similar interactions', { error: error.message });
        return [];
    }
};

/**
 * Update customer profile in vector store
 */
export const upsertCustomerProfile = async (data) => {
    const collection = collections.customerProfiles;
    if (!collection) {
        logger.warn('customerProfiles collection not available');
        return null;
    }

    try {
        await collection.upsert({
            ids: [data.id],
            embeddings: [data.embedding],
            documents: [data.document],
            metadatas: [{
                customer_id: data.customerId,
                last_updated: new Date().toISOString(),
                total_interactions: data.totalInteractions || 0,
                primary_interests: JSON.stringify(data.primaryInterests || []),
            }],
        });

        logger.debug('Upserted customer profile in vector store', { id: data.id });
        return data.id;
    } catch (error) {
        logger.error('Failed to upsert profile', { error: error.message });
        throw error;
    }
};

/**
 * Add knowledge base document
 */
export const addKnowledge = async (data) => {
    const collection = collections.knowledgeBase;
    if (!collection) {
        logger.warn('knowledgeBase collection not available');
        return null;
    }

    try {
        await collection.add({
            ids: [data.id],
            embeddings: [data.embedding],
            documents: [data.document],
            metadatas: [{
                category: data.category,
                title: data.title,
                source: data.source || 'manual',
            }],
        });

        return data.id;
    } catch (error) {
        logger.error('Failed to add knowledge', { error: error.message });
        throw error;
    }
};

/**
 * Query knowledge base
 */
export const queryKnowledge = async (embedding, n = 3) => {
    const collection = collections.knowledgeBase;
    if (!collection) {
        return [];
    }

    try {
        const results = await collection.query({
            queryEmbeddings: [embedding],
            nResults: n,
        });

        return results.documents?.[0]?.map((doc, i) => ({
            document: doc,
            metadata: results.metadatas?.[0]?.[i],
            distance: results.distances?.[0]?.[i],
        })) || [];
    } catch (error) {
        logger.error('Failed to query knowledge', { error: error.message });
        return [];
    }
};

/**
 * Alias for addInteraction (used by RAG pipeline)
 */
export const storeInteraction = addInteraction;

export default {
    COLLECTIONS,
    initCollections,
    getCollection,
    addInteraction,
    storeInteraction,
    querySimilarInteractions,
    upsertCustomerProfile,
    addKnowledge,
    queryKnowledge,
};
