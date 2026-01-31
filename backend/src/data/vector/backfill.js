/**
 * Backfill Script
 * Process existing messages and store their embeddings in ChromaDB
 */

import db from '../postgres/connection.js';
import * as messageRepository from '../postgres/repositories/messageRepository.js';
import * as conversationVectorRepository from './conversationVectorRepository.js';
import logger from '../../utils/logger.js';

async function backfillMessages() {
    try {
        logger.info('=== Starting ChromaDB Backfill ===');

        // Initialize collection
        await conversationVectorRepository.initializeCollection();
        logger.info('Collection initialized');

        // Get all customer messages from PostgreSQL
        const query = `
            SELECT m.*, s.customer_id, s.id as session_id
            FROM messages m
            JOIN sessions s ON m.session_id = s.id
            WHERE m.sender_type = 'customer'
            ORDER BY m.created_at ASC
        `;

        const result = await db.query(query);
        const messages = result.rows;

        logger.info(`Found ${messages.length} customer messages to process`);

        if (messages.length === 0) {
            logger.info('No messages to backfill');
            await db.pool.end();
            return;
        }

        let processed = 0;
        let failed = 0;

        for (const message of messages) {
            try {
                // Store embedding
                await conversationVectorRepository.storeMessageEmbedding(
                    message,
                    { id: message.customer_id },
                    { id: message.session_id }
                );

                processed++;
                logger.info(`Processed ${processed}/${messages.length}: ${message.id}`);

            } catch (error) {
                failed++;
                logger.error('Failed to process message', {
                    messageId: message.id,
                    error: error.message
                });
            }
        }

        logger.info('=== Backfill Complete ===');
        logger.info(`Total: ${messages.length}, Processed: ${processed}, Failed: ${failed}`);

        // Get final stats
        const stats = await conversationVectorRepository.getStats();
        logger.info(`ChromaDB now has ${stats.count} embeddings`);

        await db.pool.end();
        process.exit(0);

    } catch (error) {
        logger.error('Backfill failed', { error: error.message, stack: error.stack });
        await db.pool.end();
        process.exit(1);
    }
}

// Run backfill
backfillMessages();
