/**
 * Helper utilities for ContextAI
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new UUID
 */
export const generateUUID = () => uuidv4();

/**
 * Safe JSON parse with default value
 */
export const safeJsonParse = (str, defaultValue = {}) => {
    try {
        return JSON.parse(str);
    } catch {
        return defaultValue;
    }
};

/**
 * Merge objects deeply (for profile accumulation)
 * Arrays are concatenated instead of replaced
 */
export const deepMerge = (target, source) => {
    const result = { ...target };

    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
            if (Array.isArray(source[key]) && Array.isArray(target[key])) {
                // Concatenate arrays and remove duplicates for primitives
                const combined = [...target[key], ...source[key]];
                result[key] = Array.from(new Set(combined.map(JSON.stringify))).map(JSON.parse);
            } else if (!Array.isArray(source[key])) {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        } else {
            result[key] = source[key];
        }
    }

    return result;
};

/**
 * Delay execution for specified milliseconds
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sanitize string for safe storage
 */
export const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '').trim();
};

export default {
    generateUUID,
    safeJsonParse,
    deepMerge,
    delay,
    sanitize,
};
