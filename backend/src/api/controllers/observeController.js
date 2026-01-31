/**
 * Observe Controller
 * Handles observation API requests
 */

import logger from '../../utils/logger.js';
import * as customerRepository from '../../data/postgres/repositories/customerRepository.js';
import * as agentRepository from '../../data/postgres/repositories/agentRepository.js';
import * as sessionRepository from '../../data/postgres/repositories/sessionRepository.js';
import * as messageRepository from '../../data/postgres/repositories/messageRepository.js';
import * as aiPipeline from '../../ai/pipeline.js';

/**
 * Handle message observation
 * POST /api/observe/message
 */
export async function handleMessage(req, res) {
    try {
        const { customerUuid, agentId, message, sender } = req.body;

        // Basic validation
        if (!customerUuid || !agentId || !message || !sender) {
            return res.status(400).json({
                error: 'Validation Error',
                details: 'Missing required fields: customerUuid, agentId, message, sender'
            });
        }

        if (!['customer', 'agent'].includes(sender)) {
            return res.status(400).json({
                error: 'Validation Error',
                details: 'sender must be either "customer" or "agent"'
            });
        }

        logger.info('Message observation received', {
            customerUuid,
            sender,
            messageLength: message.length
        });

        // 1. Get or create customer
        const { customer } = await customerRepository.identifyOrCreate(customerUuid, {
            email: customerUuid,
            name: null
        });

        // 2. Get or create agent
        const { agent } = await agentRepository.getOrCreate(agentId, {
            name: `Agent ${agentId}`
        });

        // 3. Get or create active session
        let session = await sessionRepository.findActiveByCustomer(customer.id);
        if (!session) {
            session = await sessionRepository.create(customer.id, agent.id, 'web');
        }

        // 4. Store message in database
        const storedMessage = await messageRepository.create(
            session.id,
            sender,
            message
        );

        // 5. Trigger AI pipeline asynchronously (don't wait)
        aiPipeline.processMessage(customer, session, storedMessage, sender)
            .catch(error => {
                logger.error('AI pipeline error (async)', {
                    customerId: customer.id,
                    error: error.message
                });
            });

        // Return success immediately
        res.json({
            success: true,
            messageId: storedMessage.id,
            sessionId: session.id
        });

    } catch (error) {
        console.error('=== OBSERVE CONTROLLER ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('================================');

        logger.error('handleMessage error', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'production'
                ? 'Failed to process observation'
                : error.message
        });
    }
}

export default {
    handleMessage
};
