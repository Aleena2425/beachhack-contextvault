// Test with correct password: root
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'contextai',
    user: 'postgres',
    password: 'root'  // Updated to match your reset password
});

async function test() {
    try {
        console.log('Testing PostgreSQL connection with password: root\n');

        const result = await pool.query('SELECT NOW()');
        console.log('✅ Connection successful!');
        console.log('   Server time:', result.rows[0].now);

        console.log('\n✅ Testing agents table...');
        const insert = await pool.query(`
            INSERT INTO agents (agent_id, name, email, skills, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, ['test_final', 'Test Agent', null, ['support'], 'available']);
        console.log('✅ Agent created:', insert.rows[0].agent_id);

        await pool.query('DELETE FROM agents WHERE agent_id = $1', ['test_final']);
        console.log('✅ Cleanup complete');

        await pool.end();
        console.log('\n🎉 DATABASE CONNECTION WORKING PERFECTLY!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

test();
