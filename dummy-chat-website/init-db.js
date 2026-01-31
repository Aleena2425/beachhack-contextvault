/**
 * Initialize PostgreSQL database for dummy chat website
 * Creates users table for customer and agent credentials
 */

import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: 'postgres', // Connect to default first
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD
});

async function initDatabase() {
    const client = await pool.connect();

    try {
        console.log('🔧 Initializing dummy chat database...\n');

        // Create database
        console.log('Step 1: Creating database...');
        await client.query(`DROP DATABASE IF EXISTS ${process.env.PG_DATABASE}`);
        await client.query(`CREATE DATABASE ${process.env.PG_DATABASE}`);
        console.log('✅ Database created\n');

        client.release();

        // Connect to new database
        const appPool = new Pool({
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            database: process.env.PG_DATABASE,
            user: process.env.PG_USER,
            password: process.env.PG_PASSWORD
        });

        const appClient = await appPool.connect();

        // Create users table
        console.log('Step 2: Creating users table...');
        await appClient.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'agent')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created\n');

        // Insert demo users
        console.log('Step 3: Creating demo users...');

        const customerPassword = await bcrypt.hash('customer123', 10);
        const agentPassword = await bcrypt.hash('agent123', 10);

        await appClient.query(`
            INSERT INTO users (email, password_hash, name, role) VALUES
            ('customer@example.com', $1, 'Demo Customer', 'customer'),
            ('agent@example.com', $2, 'Demo Agent', 'agent')
        `, [customerPassword, agentPassword]);

        console.log('✅ Demo users created\n');

        console.log('═══════════════════════════════════════');
        console.log('           Demo Credentials           ');
        console.log('═══════════════════════════════════════\n');
        console.log('👤 Customer:');
        console.log('   Email: customer@example.com');
        console.log('   Password: customer123\n');
        console.log('💼 Agent:');
        console.log('   Email: agent@example.com');
        console.log('   Password: agent123\n');
        console.log('═══════════════════════════════════════\n');

        appClient.release();
        await appPool.end();
        await pool.end();

        console.log('✅ Database initialization complete!');
        console.log('\nNext: Run "npm run dev" to start the server');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        client.release();
        process.exit(1);
    }
}

initDatabase();
