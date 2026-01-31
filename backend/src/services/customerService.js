/**
 * Customer Service
 * Business logic for customer operations
 */

import customerRepository from '../data/postgres/repositories/customerRepository.js';
import ragPipeline from '../ai/ragPipeline.js';
import { pushInsightToAgent } from '../realtime/socketManager.js';
import logger from '../utils/logger.js';

export const customerService = {
    /**
     * Identify or create a customer from external website
     * If returning customer, generates and pushes insight to assigned agent
     */
    async identifyCustomer(data, assignedAgentId = null) {
        // Identify or create customer in database
        const { customer, isReturning } = await customerRepository.identifyOrCreate({
            externalId: data.external_id,
            email: data.email,
            name: data.name,
            phone: data.phone,
            metadata: data.metadata,
        });

        logger.info('Customer identified', {
            customerId: customer.id,
            isReturning,
            externalId: data.external_id
        });

        // If returning customer and there's an assigned agent, generate insight
        if (isReturning && assignedAgentId) {
            try {
                const insight = await ragPipeline.generateReturningCustomerInsight(customer.id);

                // Push insight to agent via Socket.io
                pushInsightToAgent(assignedAgentId, {
                    type: 'returning_customer',
                    customerId: customer.id,
                    ...insight,
                });

                return { customer, isReturning, insight };
            } catch (error) {
                logger.error('Failed to generate returning customer insight', {
                    error: error.message,
                    customerId: customer.id
                });
                // Don't fail the whole operation - just return without insight
            }
        }

        return { customer, isReturning, insight: null };
    },

    /**
     * Get customer profile
     */
    async getProfile(customerId) {
        const profile = await customerRepository.getProfile(customerId);
        if (!profile) {
            throw new Error(`Customer not found: ${customerId}`);
        }
        return profile;
    },

    /**
     * Get customer by external ID
     */
    async getByExternalId(externalId) {
        return customerRepository.findByExternalId(externalId);
    },

    /**
     * Update customer metadata
     */
    async updateMetadata(customerId, metadata) {
        return customerRepository.updateWithAccumulation(customerId, { metadata });
    },

    /**
     * Get recent sessions for customer
     */
    async getRecentSessions(customerId, limit = 5) {
        return customerRepository.getRecentSessions(customerId, limit);
    },
};

export default customerService;
