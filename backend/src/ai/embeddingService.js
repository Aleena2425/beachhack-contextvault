/**
 * Embedding Service
 * Handles text embedding using Google's Generative AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let embeddingModel = null;

/**
 * Initialize the embedding model
 */
export const initEmbeddingService = () => {
    try {
        const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        logger.info('Embedding service initialized');
        return true;
    } catch (error) {
        logger.error('Failed to initialize embedding service', { error: error.message });
        return false;
    }
};

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 768-dimensional embedding vector
 */
export const embed = async (text) => {
    if (!embeddingModel) {
        initEmbeddingService();
    }

    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        logger.error('Embedding failed', { error: error.message });
        throw error;
    }
};

/**
 * Generate embeddings for multiple texts
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
export const embedBatch = async (texts) => {
    if (!embeddingModel) {
        initEmbeddingService();
    }

    try {
        const embeddings = await Promise.all(
            texts.map(async (text) => {
                const result = await embeddingModel.embedContent(text);
                return result.embedding.values;
            })
        );
        return embeddings;
    } catch (error) {
        logger.error('Batch embedding failed', { error: error.message });
        throw error;
    }
};

/**
 * Get embedding dimension (for validation)
 */
export const getEmbeddingDimension = () => 768;

export default {
    initEmbeddingService,
    embed,
    embedBatch,
    getEmbeddingDimension,
};
