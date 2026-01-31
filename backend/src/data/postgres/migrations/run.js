/**
 * Migration Runner
 * Manages database schema migrations
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../../config/index.js';
import logger from '../../../utils/logger.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create connection pool
const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password
});

/**
 * Create migrations tracking table
 */
async function createMigrationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    logger.info('Migrations table ready');
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations() {
    const result = await pool.query('SELECT name FROM migrations ORDER BY id');
    return result.rows.map(row => row.name);
}

/**
 * Get list of migration files
 */
function getMigrationFiles() {
    const files = fs.readdirSync(__dirname)
        .filter(f => f.endsWith('.sql'))
        .sort();
    return files;
}

/**
 * Apply a migration
 */
async function applyMigration(filename) {
    const filepath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filepath, 'utf8');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Execute migration SQL
        await client.query(sql);

        // Record migration
        await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [filename]
        );

        await client.query('COMMIT');
        logger.info(`Migration applied: ${filename}`);
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Migration failed: ${filename}`, { error: error.message });
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Run pending migrations
 */
async function runMigrations() {
    try {
        console.log('');
        console.log('╔════════════════════════════════════════════╗');
        console.log('║   Database Migration Runner               ║');
        console.log('╚════════════════════════════════════════════╝');
        console.log('');

        // Test connection
        await pool.query('SELECT NOW()');
        logger.info('Database connection successful');

        // Create migrations table
        await createMigrationsTable();

        // Get applied and available migrations
        const applied = await getAppliedMigrations();
        const available = getMigrationFiles();

        console.log(`Applied migrations: ${applied.length}`);
        console.log(`Available migrations: ${available.length}`);
        console.log('');

        // Find pending migrations
        const pending = available.filter(m => !applied.includes(m));

        if (pending.length === 0) {
            console.log('✅ No pending migrations');
            console.log('');
            await pool.end();
            return;
        }

        console.log(`Pending migrations: ${pending.length}`);
        pending.forEach(m => console.log(`  - ${m}`));
        console.log('');

        // Apply pending migrations
        for (const migration of pending) {
            console.log(`Applying: ${migration}...`);
            await applyMigration(migration);
            console.log(`✅ Applied: ${migration}`);
        }

        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('  🎉 All migrations applied successfully!  ');
        console.log('═══════════════════════════════════════════');
        console.log('');

        await pool.end();
        process.exit(0);

    } catch (error) {
        logger.error('Migration runner failed', { error: error.message, stack: error.stack });
        console.error('');
        console.error('❌ Migration failed:', error.message);
        console.error('');
        await pool.end();
        process.exit(1);
    }
}

// Run if called directly
const isMain = process.argv[1] && (
    path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
);

if (isMain) {
    runMigrations();
}

export default runMigrations;
