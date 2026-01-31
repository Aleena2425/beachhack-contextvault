/**
 * PostgreSQL Database Connection
 * Manages connection pool and provides query interface
 */

import pg from 'pg';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

const { Pool } = pg;

// Create connection pool
const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Log pool errors
pool.on('error', (err) => {
    logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
        return result;
    } catch (error) {
        logger.error('Query error', { text: text.substring(0, 50), error: error.message });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Pool client
 */
export const getClient = async () => {
    const client = await pool.connect();
    return client;
};

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Function receiving client, should return promise
 * @returns {Promise<any>} Transaction result
 */
export const transaction = async (callback) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export const testConnection = async () => {
    try {
        await pool.query('SELECT NOW()');
        logger.info('PostgreSQL connected successfully');
        return true;
    } catch (error) {
        logger.error('PostgreSQL connection failed', { error: error.message });
        return false;
    }
};

/**
 * Close all connections in the pool
 */
export const close = async () => {
    await pool.end();
    logger.info('PostgreSQL pool closed');
};

export default {
    query,
    getClient,
    transaction,
    testConnection,
    close,
};
