/**
 * Intelligent Cache Layer
 * LRU caching for embeddings, profiles, and insights
 */

class LRUCache {
    constructor(maxSize, ttlMs) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
        this.cache = new Map();
    }

    set(key, value) {
        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (LRU)
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

export class IntelligentCache {
    constructor() {
        // Embedding cache: 10,000 entries, 1 hour TTL
        this.embeddingCache = new LRUCache(10000, 3600000);

        // Profile cache: 1,000 entries, 5 min TTL
        this.profileCache = new LRUCache(1000, 300000);

        // Insight cache: 5,000 entries, 10 min TTL
        this.insightCache = new LRUCache(5000, 600000);

        // Vector search results cache: 2,000 entries, 2 min TTL
        this.vectorSearchCache = new LRUCache(2000, 120000);
    }

    // Embedding cache methods
    getEmbedding(text) {
        const key = this.hashText(text);
        return this.embeddingCache.get(key);
    }

    setEmbedding(text, embedding) {
        const key = this.hashText(text);
        this.embeddingCache.set(key, embedding);
    }

    // Profile cache methods
    getProfile(customerId) {
        return this.profileCache.get(customerId);
    }

    setProfile(customerId, profile) {
        this.profileCache.set(customerId, profile);
    }

    invalidateProfile(customerId) {
        this.profileCache.delete(customerId);
    }

    // Insight cache methods
    getInsight(cacheKey) {
        return this.insightCache.get(cacheKey);
    }

    setInsight(cacheKey, insight) {
        this.insightCache.set(cacheKey, insight);
    }

    // Vector search cache methods
    getVectorSearch(queryKey) {
        return this.vectorSearchCache.get(queryKey);
    }

    setVectorSearch(queryKey, results) {
        this.vectorSearchCache.set(queryKey, results);
    }

    // Utility: Simple hash function for text
    hashText(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }

    // Get cache statistics
    getStats() {
        return {
            embeddings: {
                size: this.embeddingCache.size(),
                max: this.embeddingCache.maxSize,
            },
            profiles: {
                size: this.profileCache.size(),
                max: this.profileCache.maxSize,
            },
            insights: {
                size: this.insightCache.size(),
                max: this.insightCache.maxSize,
            },
            vectorSearch: {
                size: this.vectorSearchCache.size(),
                max: this.vectorSearchCache.maxSize,
            },
        };
    }

    // Clear all caches
    clearAll() {
        this.embeddingCache.clear();
        this.profileCache.clear();
        this.insightCache.clear();
        this.vectorSearchCache.clear();
    }
}

// Singleton instance
export const intelligentCache = new IntelligentCache();

export default intelligentCache;
