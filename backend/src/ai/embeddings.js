/**
 * Embedding Generation Service
 * Uses Gemini API to generate embeddings for text
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text) {
    try {
        logger.debug('Generating embedding...', { textLength: text.length });

        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);

        if (!result || !result.embedding || !result.embedding.values) {
            throw new Error('Invalid embedding response from Gemini API');
        }

        logger.info('✅ Embedding generated successfully', {
            dimensions: result.embedding.values.length
        });

        return result.embedding.values; // Array of floats (768 dimensions)

    } catch (error) {
        logger.error('❌ Embedding generation failed', {
            error: error.message,
            stack: error.stack,
            textPreview: text.substring(0, 50)
        });
        throw error; // Re-throw to propagate error
    }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts) {
    const embeddings = [];

    for (const text of texts) {
        try {
            const embedding = await generateEmbedding(text);
            embeddings.push(embedding);
        } catch (error) {
            logger.error('Batch embedding failed for text', { error: error.message });
            embeddings.push(null); // Keep array aligned
        }
    }

    return embeddings;
}

export default {
    generateEmbedding,
    generateEmbeddings
};
