/**
 * Embedding Queue
 * Batches embedding requests for efficiency
 */

import { embed, embedBatch } from './embeddingService.js';
import { intelligentCache } from './cache.js';
import logger from '../utils/logger.js';

class EmbeddingQueue {
    constructor() {
        this.queue = [];
        this.batchSize = 20;
        this.flushInterval = 5000; // 5 seconds
        this.processing = false;

        // Start auto-flush timer
        this.startAutoFlush();
    }

    /**
     * Add message to embedding queue
     * @param {Object} message - Message object with id, content, metadata
     * @param {string} priority - 'urgent' or 'normal'
     * @returns {Promise<Array>} Embedding vector
     */
    async add(message, priority = 'normal') {
        // Check cache first
        const cached = intelligentCache.getEmbedding(message.content);
        if (cached) {
            logger.debug('Embedding cache hit', { messageId: message.id });
            return cached;
        }

        // Urgent messages bypass queue
        if (priority === 'urgent') {
            return await this.embedImmediate(message);
        }

        // Add to queue
        return new Promise((resolve, reject) => {
            this.queue.push({
                message,
                resolve,
                reject,
            });

            // Flush if batch size reached
            if (this.queue.length >= this.batchSize) {
                this.flush();
            }
        });
    }

    /**
     * Embed immediately (bypass queue)
     */
    async embedImmediate(message) {
        try {
            const embedding = await embed(message.content);

            // Cache result
            intelligentCache.setEmbedding(message.content, embedding);

            logger.debug('Immediate embedding generated', { messageId: message.id });
            return embedding;
        } catch (error) {
            logger.error('Immediate embedding failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Flush queue and process batch
     */
    async flush() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;
        const batch = this.queue.splice(0, this.batchSize);

        try {
            // Extract texts
            const texts = batch.map(item => item.message.content);

            // Batch embed
            const embeddings = await embedBatch(texts);

            // Cache and resolve
            batch.forEach((item, index) => {
                const embedding = embeddings[index];

                // Cache
                intelligentCache.setEmbedding(item.message.content, embedding);

                // Resolve promise
                item.resolve(embedding);
            });

            logger.info('Batch embedding completed', { count: batch.length });
        } catch (error) {
            logger.error('Batch embedding failed', { error: error.message });

            // Reject all promises
            batch.forEach(item => item.reject(error));
        } finally {
            this.processing = false;
        }
    }

    /**
     * Start auto-flush timer
     */
    startAutoFlush() {
        setInterval(() => {
            if (this.queue.length > 0) {
                this.flush();
            }
        }, this.flushInterval);
    }

    /**
     * Get queue statistics
     */
    getStats() {
        return {
            queueLength: this.queue.length,
            batchSize: this.batchSize,
            processing: this.processing,
        };
    }
}

// Singleton instance
export const embeddingQueue = new EmbeddingQueue();

export default embeddingQueue;
