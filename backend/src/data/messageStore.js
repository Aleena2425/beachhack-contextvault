/**
 * In-Memory Message Store
 * Stores chat messages temporarily (no database yet)
 */

import { randomUUID } from 'crypto';
import logger from '../utils/logger.js';

// Map: customerUuid -> Array of messages
const messageStore = new Map();

/**
 * Add a message to the store
 */
export function addMessage(customerUuid, messageData) {
    const message = {
        id: randomUUID(),
        customerUuid,
        agentId: messageData.agentId,
        sender: messageData.sender,
        content: messageData.content,
        timestamp: new Date()
    };

    if (!messageStore.has(customerUuid)) {
        messageStore.set(customerUuid, []);
    }

    messageStore.get(customerUuid).push(message);

    logger.debug('Message stored', {
        customerUuid,
        sender: message.sender,
        messageCount: messageStore.get(customerUuid).length
    });

    return message;
}

/**
 * Get conversation history for a customer
 */
export function getHistory(customerUuid, limit = 10) {
    const messages = messageStore.get(customerUuid) || [];
    return messages.slice(-limit); // Get last N messages
}

/**
 * Clear all messages (for testing)
 */
export function clear() {
    messageStore.clear();
    logger.info('Message store cleared');
}

/**
 * Get stats
 */
export function getStats() {
    let totalMessages = 0;
    messageStore.forEach(messages => {
        totalMessages += messages.length;
    });

    return {
        customers: messageStore.size,
        totalMessages
    };
}

export default {
    addMessage,
    getHistory,
    clear,
    getStats
};
