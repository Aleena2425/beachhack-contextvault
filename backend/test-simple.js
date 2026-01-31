// Ultra-simple connection test
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'contextai',
    user: 'postgres',
    password: 'password'
});

async function test() {
    try {
        console.log('Connecting to PostgreSQL...');
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Connected! Time:', result.rows[0].now);

        console.log('\nChecking agents table...');
        const agents = await pool.query('SELECT * FROM agents LIMIT 1');
        console.log('✅ Agents table exists, rows:', agents.rows.length);

        console.log('\nTrying to insert agent...');
        const insert = await pool.query(`
            INSERT INTO agents (agent_id, name, email, skills, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, ['test_123', 'Test', null, [], 'available']);
        console.log('✅ Insert successful:', insert.rows[0]);

        await pool.query('DELETE FROM agents WHERE agent_id = $1', ['test_123']);
        console.log('✅ Cleanup done');

        await pool.end();
        console.log('\n✅ ALL TESTS PASSED!');

    } catch (error) {
        console.error('\n❌ ERROR:');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('\nDetails:', error.detail);
        console.error('\nHint:', error.hint);
        await pool.end();
        process.exit(1);
    }
}

test();
