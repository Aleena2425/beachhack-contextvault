/**
 * ChromaDB Client
 * HTTP client for ChromaDB vector database
 */

import config from '../../config/index.js';
import logger from '../../utils/logger.js';

const CHROMA_URL = `http://${config.chroma.host}:${config.chroma.port}`;

/**
 * Test ChromaDB connection
 */
export async function testConnection() {
    try {
        const response = await fetch(`${CHROMA_URL}/api/v1/heartbeat`);

        if (!response.ok) {
            throw new Error(`ChromaDB heartbeat failed with status: ${response.status}`);
        }

        const data = await response.json();
        logger.info('ChromaDB connection successful', {
            heartbeat: data,
            url: `${CHROMA_URL}/api/v1/heartbeat`
        });

        return true;

    } catch (error) {
        logger.error('ChromaDB connection failed', {
            error: error.message,
            url: `${CHROMA_URL}/api/v1/heartbeat`
        });
        throw error; // Re-throw to propagate error
    }
}

/**
 * Get or create a collection
 */
export async function getOrCreateCollection(name, metadata = {}) {
    try {
        // Try to get existing collection
        const getResponse = await fetch(`${CHROMA_URL}/api/v1/collections/${name}`);

        if (getResponse.ok) {
            const collection = await getResponse.json();
            logger.debug('Collection found', { name });
            return collection;
        }

        // Create new collection
        const createResponse = await fetch(`${CHROMA_URL}/api/v1/collections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, metadata })
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to create collection: ${createResponse.status}`);
        }

        const collection = await createResponse.json();
        logger.info('Collection created', { name });
        return collection;

    } catch (error) {
        logger.error('Collection operation failed', { name, error: error.message });
        throw error;
    }
}

/**
 * Add embeddings to collection
 */
export async function addEmbeddings(collectionName, ids, embeddings, metadatas) {
    try {
        const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ids,
                embeddings,
                metadatas
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to add embeddings: ${response.status}`);
        }

        logger.debug('Embeddings added', {
            collection: collectionName,
            count: ids.length
        });

        return true;

    } catch (error) {
        logger.error('Add embeddings failed', {
            collection: collectionName,
            error: error.message
        });
        throw error;
    }
}

/**
 * Query collection for similar embeddings
 */
export async function queryEmbeddings(collectionName, queryEmbeddings, nResults = 5, where = null) {
    try {
        const body = {
            query_embeddings: queryEmbeddings,
            n_results: nResults
        };

        if (where) {
            body.where = where;
        }

        const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Query failed: ${response.status}`);
        }

        const results = await response.json();
        logger.debug('Query completed', {
            collection: collectionName,
            resultsCount: results.ids?.[0]?.length || 0
        });

        return results;

    } catch (error) {
        logger.error('Query embeddings failed', {
            collection: collectionName,
            error: error.message
        });
        throw error;
    }
}

/**
 * Get collection count
 */
export async function getCollectionCount(collectionName) {
    try {
        const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}/count`);

        if (!response.ok) {
            return 0;
        }

        const count = await response.json();
        return count;

    } catch (error) {
        logger.error('Get collection count failed', { error: error.message });
        return 0;
    }
}

export default {
    testConnection,
    getOrCreateCollection,
    addEmbeddings,
    queryEmbeddings,
    getCollectionCount
};
