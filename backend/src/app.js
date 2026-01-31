/**
 * ContextAI Backend - Checkpoint 1
 * Observation model with AI insights
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config/index.js';
import logger from './utils/logger.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import authRoutes from './api/routes/authRoutes.js';
import observeRoutes from './api/routes/observeRoutes.js';
import profileRoutes from './api/routes/profileRoutes.js';
import * as agentSocket from './realtime/agentSocket.js';
import * as customerRepository from './data/postgres/repositories/customerRepository.js';
import * as sessionRepository from './data/postgres/repositories/sessionRepository.js';
import * as messageRepository from './data/postgres/repositories/messageRepository.js';
import * as insightRepository from './data/postgres/repositories/insightRepository.js';
import * as chromaClient from './data/vector/chromaClient.js';
import * as conversationVectorRepository from './data/vector/conversationVectorRepository.js';
import db from './data/postgres/connection.js';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });

    next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test PostgreSQL connection
        await db.testConnection();

        // Get PostgreSQL stats
        const customerCount = await customerRepository.count();
        const sessionStats = await sessionRepository.getStats();
        const messageCount = await messageRepository.count();
        const insightCount = await insightRepository.count();

        // Test ChromaDB connection
        let chromaStatus = 'disconnected';
        let vectorCount = 0;
        try {
            await chromaClient.testConnection();
            const vectorStats = await conversationVectorRepository.getStats();
            chromaStatus = 'connected';
            vectorCount = vectorStats.count;
        } catch (chromaError) {
            logger.warn('ChromaDB not available', { error: chromaError.message });
        }

        res.json({
            status: 'ok',
            mode: 'observation',
            checkpoint: 3,
            storage: 'postgresql',
            database: 'connected',
            vectorDb: chromaStatus,
            stats: {
                customers: customerCount,
                sessions: {
                    total: sessionStats.total,
                    active: sessionStats.active
                },
                messages: messageCount,
                insights: insightCount,
                embeddings: vectorCount
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/observe', observeRoutes);
app.use('/api/profiles', profileRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize Socket.io namespaces
agentSocket.initializeAgentSocket(io);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

// Start server
const PORT = config.port;

httpServer.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   ContextAI - Checkpoint 2                ║');
    console.log('║   Database Integration Complete           ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Server running: http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`✅ Storage: PostgreSQL (6 tables)`);
    console.log(`✅ AI: Gemini Pro`);
    console.log(`✅ Socket.io: /agent namespace ready`);
    console.log(`✅ Profiles: Incremental updates`);
    console.log('');
    console.log('📡 Ready to receive observations from dummy chat');
    console.log('🤖 AI insights will be pushed to agents');
    console.log('💾 All data persisted to database');
    console.log('');

    logger.info('ContextAI backend started', {
        port: PORT,
        mode: 'observation',
        checkpoint: 2,
        storage: 'postgresql'
    });
});

export default app;
