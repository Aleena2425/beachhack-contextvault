/**
 * LangChain-based memory retrieval for ContextAI
 * Uses Chroma per-customer namespace + Google embeddings to retrieve relevant memory for Gemini.
 */

import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import config from '../config/index.js';
import { getEmbeddingDimension } from './embeddingService.js';
import logger from '../utils/logger.js';

let embeddingsInstance = null;

/**
 * Get or create a shared LangChain Embeddings instance (Google text-embedding-004).
 * Matches embeddingService dimension for Chroma compatibility.
 */
function getLangChainEmbeddings() {
    if (!embeddingsInstance) {
        if (!config.gemini?.apiKey) {
            throw new Error('GEMINI_API_KEY required for LangChain embeddings');
        }
        embeddingsInstance = new GoogleGenerativeAIEmbeddings({
            apiKey: config.gemini.apiKey,
            model: 'text-embedding-004',
            stripNewLines: true,
        });
        logger.debug('LangChain Google embeddings initialized');
    }
    return embeddingsInstance;
}

/**
 * Chroma collection name for a customer (per-customer namespace).
 * Must match chromaClient.getOrCreateCustomerCollection naming.
 */
function customerCollectionName(customerId) {
    return `customer_${String(customerId).replace(/-/g, '_')}`;
}

/**
 * Chroma URL from config.
 */
function chromaUrl() {
    const { host, port } = config.chroma;
    return `http://${host}:${port}`;
}

/**
 * Get LangChain Chroma vector store for a customer's namespace.
 * Uses real SDK: Chroma(embeddings, { url, collectionName, numDimensions }).
 */
export async function getCustomerVectorStore(customerId) {
    const embeddings = getLangChainEmbeddings();
    const collectionName = customerCollectionName(customerId);
    const store = new Chroma(embeddings, {
        url: chromaUrl(),
        collectionName,
        numDimensions: getEmbeddingDimension(),
    });
    return store;
}

/**
 * Retrieve memory for a customer using LangChain retriever (similarity search).
 * Returns documents formatted for Gemini context (document text + metadata).
 * @param {string} customerId - Customer UUID
 * @param {string} query - Natural language query (e.g. current message or "customer history")
 * @param {number} k - Max number of relevant documents
 * @returns {Promise<Array<{ document: string, metadata: object, score?: number }>>}
 */
export async function retrieveMemory(customerId, query, k = 5) {
    try {
        const store = await getCustomerVectorStore(customerId);
        const retriever = store.asRetriever(k);
        const docs = await retriever.invoke(query);
        const formatted = docs.map((doc) => ({
            document: doc.pageContent,
            metadata: doc.metadata ?? {},
            score: doc.metadata?.score,
        }));
        logger.debug('LangChain memory retrieved', { customerId, k, count: formatted.length });
        return formatted;
    } catch (error) {
        logger.error('LangChain memory retrieval failed', { error: error.message, customerId });
        return [];
    }
}

/**
 * Similarity search with scores (LangChain vector store API).
 * @param {string} customerId - Customer UUID
 * @param {string} query - Query text
 * @param {number} k - Max results
 * @returns {Promise<Array<{ document: string, metadata: object, score: number }>>}
 */
export async function similaritySearchWithScore(customerId, query, k = 5) {
    try {
        const store = await getCustomerVectorStore(customerId);
        const results = await store.similaritySearchWithScore(query, k);
        return results.map(([doc, score]) => ({
            document: doc.pageContent,
            metadata: doc.metadata ?? {},
            score: typeof score === 'number' ? 1 - Math.min(1, score) : 0.5,
        }));
    } catch (error) {
        logger.error('Similarity search failed', { error: error.message, customerId });
        return [];
    }
}

/**
 * Prepare context for Gemini Pro: merge retrieved memory + session messages into a structure
 * suitable for buildInsightPrompt / buildReturningCustomerPrompt.
 * @param {string} customerId - Customer UUID
 * @param {string} queryOrMessage - Current message or query for memory retrieval
 * @param {object} options - { k, sessionMessages }
 * @returns {Promise<{ relevantInteractions: array, memoryDocs: array }>}
 */
export async function prepareContextForGemini(customerId, queryOrMessage, options = {}) {
    const { k = 5, sessionMessages = [] } = options;
    const memoryDocs = await retrieveMemory(customerId, queryOrMessage, k);
    const relevantInteractions = memoryDocs.map((m) => ({
        document: m.document,
        metadata: m.metadata,
        score: m.score ?? 0.5,
    }));
    return {
        relevantInteractions,
        memoryDocs,
        sessionMessages,
    };
}

export default {
    getLangChainEmbeddings,
    getCustomerVectorStore,
    retrieveMemory,
    similaritySearchWithScore,
    prepareContextForGemini,
};
