/**
 * Gemini Processor
 * Handles all interactions with Google's Gemini Pro model
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { safeJsonParse } from '../utils/helpers.js';

let model = null;

/**
 * Initialize Gemini Pro model
 */
export const initGeminiProcessor = () => {
    try {
        const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048,
            },
        });
        logger.info('Gemini processor initialized');
        return true;
    } catch (error) {
        logger.error('Failed to initialize Gemini processor', { error: error.message });
        return false;
    }
};

const DEFAULT_GEMINI_TIMEOUT_MS = 30_000;

/**
 * Run a promise with a timeout; reject with a tagged error for failure handler.
 */
function withTimeout(promise, ms, code = 'GEMINI_TIMEOUT') {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => {
                const err = new Error('Gemini request timed out');
                err.code = code;
                reject(err);
            }, ms);
        }),
    ]);
}

/**
 * Generate content from Gemini Pro (with timeout and graceful error tagging).
 * @param {string} prompt - The prompt to send
 * @param {number} timeoutMs - Max wait time (default 30s)
 * @returns {Promise<Object>} Parsed JSON response
 */
export const generate = async (prompt, timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS) => {
    if (!model) {
        initGeminiProcessor();
    }

    const startTime = Date.now();

    try {
        const result = await withTimeout(
            model.generateContent(prompt),
            timeoutMs
        );
        const response = result.response;
        const text = response.text();

        const processingTime = Date.now() - startTime;
        logger.debug('Gemini generation completed', { processingTime });

        // Try to parse as JSON
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = safeJsonParse(cleanedText, null);

        if (!parsed) {
            logger.warn('Failed to parse Gemini response as JSON', { text: text.substring(0, 200) });
            return { raw: text, processingTime };
        }

        return { ...parsed, processingTime };
    } catch (error) {
        if (!error.code) {
            error.code = 'GEMINI_FAILED';
        }
        logger.error('Gemini generation failed', { error: error.message, code: error.code });
        throw error;
    }
};

/**
 * Generate customer insight
 */
export const generateInsight = async (prompt) => {
    const result = await generate(prompt);

    return {
        summary: result.summary || 'Unable to generate summary',
        intent: result.intent || 'unknown',
        urgency: result.urgency || 'medium',
        sentiment: result.sentiment || 'neutral',
        recommendations: result.recommendations || [],
        extractedPreferences: result.extractedPreferences || {},
        suggestedResponses: result.suggestedResponses || [],
        processingTime: result.processingTime,
    };
};

/**
 * Generate returning customer summary
 */
export const generateReturningCustomerSummary = async (prompt) => {
    const result = await generate(prompt);

    return {
        summary: result.summary || 'Returning customer',
        keyInsights: result.keyInsights || [],
        recommendations: result.recommendations || [],
        warningFlags: result.warningFlags || [],
        topInterests: result.topInterests || [],
        processingTime: result.processingTime,
    };
};

/**
 * Generate session summary
 */
export const generateSessionSummary = async (prompt) => {
    const result = await generate(prompt);
    return result.raw || result.summary || 'Session completed';
};

/**
 * Extract preferences from messages
 */
export const extractPreferences = async (prompt) => {
    const result = await generate(prompt);

    return {
        communicationPreference: result.communicationPreference,
        productInterests: result.productInterests || [],
        concerns: result.concerns || [],
        budget: result.budget,
        timeline: result.timeline,
        otherPreferences: result.otherPreferences || {},
    };
};

export default {
    initGeminiProcessor,
    generate,
    generateInsight,
    generateReturningCustomerSummary,
    generateSessionSummary,
    extractPreferences,
};
