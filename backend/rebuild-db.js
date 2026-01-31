// Drop all tables and recreate from scratch
import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'contextai',
    user: 'postgres',
    password: 'root'
});

async function rebuild() {
    try {
        console.log('🗑️  Dropping all existing tables...\n');

        await pool.query('DROP TABLE IF EXISTS customer_profiles CASCADE');
        await pool.query('DROP TABLE IF EXISTS ai_insights CASCADE');
        await pool.query('DROP TABLE IF EXISTS messages CASCADE');
        await pool.query('DROP TABLE IF EXISTS sessions CASCADE');
        await pool.query('DROP TABLE IF EXISTS agents CASCADE');
        await pool.query('DROP TABLE IF EXISTS customers CASCADE');
        await pool.query('DROP TABLE IF EXISTS migrations CASCADE');

        console.log('✅ All tables dropped\n');

        console.log('📝 Reading schema file...\n');
        const schema = fs.readFileSync('./src/data/postgres/migrations/001_initial_schema.sql', 'utf8');

        console.log('🏗️  Creating tables...\n');
        await pool.query(schema);

        console.log('✅ Schema created successfully!\n');

        // Verify agents table has skills column
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'agents' 
            ORDER BY ordinal_position
        `);

        console.log('📋 Agents table columns:');
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.column_name}: ${row.data_type}`);
        });

        await pool.end();
        console.log('\n🎉 DATABASE REBUILT SUCCESSFULLY!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        await pool.end();
        process.exit(1);
    }
}

rebuild();
