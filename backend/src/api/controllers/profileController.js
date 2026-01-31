/**
 * Profile Controller
 * Handles fetching consolidated customer 360 view
 */

import * as customerRepository from '../../data/postgres/repositories/customerRepository.js';
import * as sessionRepository from '../../data/postgres/repositories/sessionRepository.js';
import * as insightRepository from '../../data/postgres/repositories/insightRepository.js';
import logger from '../../utils/logger.js';

/**
 * Get full customer profile by UUID
 */
export async function getProfile(req, res) {
    try {
        const { uuid } = req.params;

        // 1. Get Basic Customer Info
        const customer = await customerRepository.findByExternalId(uuid);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // 2. Get Recent Session
        const recentSessions = await sessionRepository.getRecentByCustomer(customer.id, 1);
        const activeSession = recentSessions[0] || null;

        // 3. Get Latest Insights relative to that session (or general)
        let latestInsight = null;
        if (activeSession) {
            latestInsight = await insightRepository.findLatestBySession(activeSession.id);
        }

        // 4. Construct Consolidated Profile
        const isEmail = uuid.includes('@');
        const profile = {
            uuid: customer.external_id,
            name: customer.name || `Customer ${(customer.external_id || uuid).substring(0, 4)}`,
            email: customer.email || (isEmail ? uuid : `${uuid}@example.com`),

            // Derived from Customer Metadata or default
            budget_max: customer.metadata?.budget || 'Unknown',
            product_interest: customer.metadata?.interest || 'General',

            // Derived from Latest Insight
            urgency: latestInsight?.urgency || 'low',
            sentiment: latestInsight?.sentiment || 'neutral',
            intent: latestInsight?.intent || 'unknown',

            // The "AI Summary"
            ai_summary: latestInsight?.summary || 'No recent analysis available for this customer.',
            suggestions: latestInsight?.suggestions || [],

            // Context
            last_active: activeSession?.started_at || null,
            status: activeSession?.status === 'active' ? 'online' : 'offline'
        };

        res.json(profile);

    } catch (error) {
        logger.error('Error fetching profile', { uuid: req.params.uuid, error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    }
}
