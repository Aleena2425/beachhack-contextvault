/**
 * Socket.io Event Handlers
 * Handles incoming socket events from agents
 */

import { CLIENT_EVENTS, AGENT_EVENTS } from './events.js';
import { roomManager } from './roomManager.js';
import ragPipeline from '../ai/ragPipeline.js';
import logger from '../utils/logger.js';

/**
 * Register event handlers for a socket connection
 */
export const registerEventHandlers = (socket, io) => {
    const agentId = socket.data.agentId;

    // Handle customer subscription
    socket.on(CLIENT_EVENTS.SUBSCRIBE_CUSTOMER, (data) => {
        logger.debug('Agent subscribed to customer', { agentId, customerId: data.customerId });
        // Could track which agents are following which customers
    });

    // Handle insight request (on-demand)
    socket.on(CLIENT_EVENTS.REQUEST_INSIGHT, async (data) => {
        const { customerId } = data;
        logger.info('Agent requested insight', { agentId, customerId });

        try {
            const insight = await ragPipeline.generateReturningCustomerInsight(customerId);

            socket.emit(AGENT_EVENTS.CUSTOMER_INSIGHT, {
                event_id: `evt_${Date.now()}`,
                customer_id: customerId,
                insight: {
                    type: 'on_demand',
                    ...insight,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error('Failed to generate on-demand insight', { error: error.message });
            socket.emit(AGENT_EVENTS.CONNECTION_ERROR, {
                code: 'INSIGHT_GENERATION_FAILED',
                message: 'Failed to generate customer insight',
                customerId,
            });
        }
    });

    // Handle insight acknowledgement
    socket.on(CLIENT_EVENTS.INSIGHT_ACKNOWLEDGED, (data) => {
        logger.debug('Insight acknowledged', { agentId, eventId: data.event_id });
        // Could track acknowledgements for analytics
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        logger.info('Agent disconnected', { agentId, reason });
        roomManager.leaveAgentRooms(socket, agentId);
    });

    // Handle errors
    socket.on('error', (error) => {
        logger.error('Socket error', { agentId, error: error.message });
    });
};

export default {
    registerEventHandlers,
};
