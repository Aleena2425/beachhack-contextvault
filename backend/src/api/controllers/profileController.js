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
            logger.info('Customer not found, returning dummy profile', { uuid });

            // Premium Demo Profile
            if (uuid === 'PORSCHE-911-VIP') {
                return res.json({
                    uuid: 'PORSCHE-911-VIP',
                    name: 'Alexander Sterling',
                    email: 'a.sterling@private.com',
                    budget_max: '150,000',
                    product_interest: '1973 Porsche 911 Carrera RS',
                    urgency: 'high',
                    intent: 'purchase',
                    ai_summary: 'Alexander is a seasoned collector of air-cooled Porsches. He is specifically looking for a matching-numbers 1973 Carrera RS. He has high technical knowledge and is ready to move quickly for the right quality.',
                    suggestions: [
                        'Provide documentation on engine stampings',
                        'Offer an inspection via a certified Porsche specialist',
                        'Discuss current auction trends for the 2.7 RS'
                    ],
                    last_active: new Date().toISOString(),
                    status: 'online'
                });
            }

            const isEmail = uuid.includes('@');
            return res.json({
                uuid: uuid,
                name: isEmail ? uuid.split('@')[0] : `Demo Customer`,
                email: isEmail ? uuid : `${uuid}@example.com`,
                budget_max: '75,000',
                product_interest: 'Classic Porsche 911',
                urgency: 'high',
                intent: 'purchase',
                ai_summary: 'Customer is highly interested in a 1970s Porsche 911. They have a healthy budget and are looking to close a deal soon. System fallback data provided.',
                suggestions: [
                    'Offer a detailed condition report',
                    'Schedule a private viewing this weekend',
                    'Provide service history overview'
                ],
                last_active: new Date().toISOString(),
                status: 'online'
            });
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

        // Prioritize AI context from latest insight
        const profile = {
            uuid: customer.external_id,
            name: customer.name || `Customer ${(customer.external_id || uuid).substring(0, 4)}`,
            email: customer.email || (isEmail ? uuid : `${uuid}@example.com`),

            // Prioritize AI-derived metadata from the latest insight
            // The pipeline stores these in a structured way now
            budget_max: latestInsight?.metadata?.budget || latestInsight?.budget || customer.metadata?.budget || 'Unknown',
            product_interest: latestInsight?.metadata?.interest || latestInsight?.interest || customer.metadata?.interest || 'General',

            // Derived from Latest Insight
            urgency: latestInsight?.urgency || 'low',
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
