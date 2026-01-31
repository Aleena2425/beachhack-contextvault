import pg from 'pg';
import config from './src/config/index.js';

const { Pool } = pg;
const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password
});

async function patch() {
    try {
        console.log('Updating existing agents...');
        await pool.query("UPDATE agents SET email = 'agent_' || id || '@contextai.com' WHERE email IS NULL");

        console.log('Adding password_hash...');
        await pool.query("ALTER TABLE agents ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)");

        console.log('Setting email to NOT NULL...');
        await pool.query("ALTER TABLE agents ALTER COLUMN email SET NOT NULL");

        console.log('Adding unique constraint...');
        try {
            await pool.query("ALTER TABLE agents ADD CONSTRAINT agents_email_unique UNIQUE (email)");
        } catch (e) {
            console.log('Unique constraint already exists or failed:', e.message);
        }

        // Also fix the migrations table typo to avoid future confusion
        console.log('Fixing migrations table name typo...');
        await pool.query("UPDATE migrations SET name = '001_initial_schema.sql' WHERE name = '001_initial_sql'");

        // Mark our migration as applied
        console.log('Marking 002_add_auth_fields.sql as applied...');
        await pool.query("INSERT INTO migrations (name) VALUES ('002_add_auth_fields.sql') ON CONFLICT (name) DO NOTHING");

        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error('Patch failed:', e);
        process.exit(1);
    }
}

patch();
