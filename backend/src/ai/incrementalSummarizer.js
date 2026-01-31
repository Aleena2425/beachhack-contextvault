/**
 * Incremental Summarizer
 * Updates customer summaries progressively without losing history
 */

import { generateInsight } from './geminiProcessor.js';
import customerRepository from '../data/postgres/repositories/customerRepository.js';
import logger from '../utils/logger.js';

export class IncrementalSummarizer {
    /**
     * Update customer summary incrementally
     */
    async updateCustomerSummary(customerId, newInsight) {
        try {
            // 1. Get existing profile
            const existing = await customerRepository.findById(customerId);

            if (!existing) {
                logger.warn('Customer not found for summary update', { customerId });
                return null;
            }

            // 2. Determine if update needed
            const needsUpdate = this.shouldUpdate(existing, newInsight);

            if (!needsUpdate) {
                logger.debug('Summary update not needed', { customerId });
                return existing.metadata?.summary || null;
            }

            // 3. Generate incremental update
            const updated = await this.generateIncremental(existing, newInsight);

            // 4. Store with versioning
            await customerRepository.update(customerId, {
                metadata: {
                    ...existing.metadata,
                    summary: updated,
                    summary_version: (existing.metadata?.summary_version || 0) + 1,
                    last_summary_update: new Date().toISOString(),
                    update_trigger: newInsight.intent || 'unknown',
                },
            });

            logger.info('Customer summary updated', {
                customerId,
                version: (existing.metadata?.summary_version || 0) + 1,
            });

            return updated;
        } catch (error) {
            logger.error('Failed to update customer summary', {
                error: error.message,
                customerId,
            });
            return null;
        }
    }

    /**
     * Determine if summary update is needed
     */
    shouldUpdate(existing, newInsight) {
        // Always update if no summary exists
        if (!existing.metadata?.summary) {
            return true;
        }

        // Update triggers
        const lastUpdate = existing.metadata?.last_summary_update;
        const daysSinceUpdate = lastUpdate
            ? this.daysSince(new Date(lastUpdate))
            : 999;

        // Trigger 1: New intent detected
        const existingIntents = existing.extracted_intents || [];
        const hasNewIntent = newInsight.intent &&
            !existingIntents.some(i => i.intent === newInsight.intent);

        // Trigger 2: Significant time gap (> 30 days)
        const significantTimeGap = daysSinceUpdate > 30;

        // Trigger 3: Preference change detected
        const hasPreferenceChange = newInsight.preferences &&
            Object.keys(newInsight.preferences).length > 0;

        // Trigger 4: Urgency escalation
        const isUrgent = newInsight.urgency === 'high' || newInsight.urgency === 'critical';

        return hasNewIntent || significantTimeGap || hasPreferenceChange || isUrgent;
    }

    /**
     * Generate incremental summary update
     */
    async generateIncremental(existing, newInsight) {
        const prompt = `
You are updating a customer profile summary. Your goal is to preserve all historical context while integrating new information.

EXISTING SUMMARY:
${existing.metadata?.summary || 'No previous summary.'}

EXISTING PROFILE DATA:
- Name: ${existing.name || 'Unknown'}
- Total Sessions: ${existing.total_sessions || 0}
- Preferences: ${JSON.stringify(existing.preferences || {})}
- Tags: ${(existing.tags || []).join(', ')}

NEW INFORMATION:
- Intent: ${newInsight.intent || 'Unknown'}
- Urgency: ${newInsight.urgency || 'Unknown'}
- Sentiment: ${newInsight.sentiment || 'Unknown'}
- New Preferences: ${JSON.stringify(newInsight.preferences || {})}
- Context: ${newInsight.summary || ''}

INSTRUCTIONS:
1. Preserve all historical context from the existing summary
2. Integrate the new information seamlessly
3. Highlight any changes or evolution in customer behavior
4. Keep the summary concise (max 200 words)
5. Focus on actionable insights for sales agents

Generate the UPDATED summary (plain text, no JSON):
`.trim();

        try {
            const response = await generateInsight(prompt, {
                temperature: 0.5, // Lower temperature for consistency
                maxTokens: 300,
            });

            return response.trim();
        } catch (error) {
            logger.error('Failed to generate incremental summary', {
                error: error.message,
            });

            // Fallback: append to existing
            return this.fallbackMerge(existing, newInsight);
        }
    }

    /**
     * Fallback merge (simple append)
     */
    fallbackMerge(existing, newInsight) {
        const existingSummary = existing.metadata?.summary || '';
        const newInfo = `[${new Date().toISOString()}] ${newInsight.intent || 'Interaction'}: ${newInsight.summary || 'No details'}`;

        return `${existingSummary}\n\n${newInfo}`.trim();
    }

    /**
     * Calculate days since date
     */
    daysSince(date) {
        const now = new Date();
        const diff = now - date;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Generate summary hierarchy levels
     */
    async generateHierarchy(customerId) {
        const profile = await customerRepository.findById(customerId);

        if (!profile) return null;

        const fullSummary = profile.metadata?.summary || '';

        return {
            ultraShort: await this.generateLevel(fullSummary, 50), // 50 words
            standard: await this.generateLevel(fullSummary, 200), // 200 words
            detailed: fullSummary, // Full summary
        };
    }

    /**
     * Generate summary at specific word count
     */
    async generateLevel(fullSummary, maxWords) {
        if (!fullSummary) return '';

        const prompt = `
Summarize the following customer profile in EXACTLY ${maxWords} words or less:

${fullSummary}

Summary (${maxWords} words max):
`.trim();

        try {
            const response = await generateInsight(prompt, {
                temperature: 0.3,
                maxTokens: maxWords * 2,
            });

            return response.trim();
        } catch (error) {
            // Fallback: truncate
            const words = fullSummary.split(/\s+/);
            return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '');
        }
    }
}

export const incrementalSummarizer = new IncrementalSummarizer();

export default incrementalSummarizer;
