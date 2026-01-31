import dotenv from 'dotenv';
dotenv.config();

/**
 * Parse CORS origin(s). Supports:
 * - Single origin: CORS_ORIGIN=http://localhost:3000
 * - Multiple (comma-separated): CORS_ORIGIN=https://app.com,https://widget.example.com
 * - Allow all (external websites): CORS_ORIGIN=* or CORS_ALLOW_ALL=true
 */
function getCorsOrigin() {
    const allowAll = process.env.CORS_ALLOW_ALL === 'true';
    const raw = process.env.CORS_ORIGIN || '';
    if (allowAll || raw.trim() === '*') return '*';
    if (!raw.trim()) return ['http://localhost:3000'];
    const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
    return origins.length ? origins : ['http://localhost:3000'];
}

const corsOrigin = getCorsOrigin();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',

    // PostgreSQL
    database: {
        url: process.env.DATABASE_URL,
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT || '5432'),
        database: process.env.PG_DATABASE || 'contextai',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'password',
    },

    // ChromaDB
    chroma: {
        host: process.env.CHROMA_HOST || 'localhost',
        port: parseInt(process.env.CHROMA_PORT || '8000'),
    },

    // Google AI
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },

    // CORS – supports multiple origins and * for external websites
    cors: {
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
};

export default config;
