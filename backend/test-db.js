// Quick database test script
import db from './src/data/postgres/connection.js';

async function test() {
    try {
        console.log('Testing database connection...');

        // Test connection
        await db.testConnection();
        console.log('✅ Connection successful');

        // Check agents table structure
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'agents' 
            ORDER BY ordinal_position
        `);

        console.log('\n📋 Agents table columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });

        // Try to create an agent
        console.log('\n🧪 Testing agent creation...');
        const testAgent = await db.query(`
            INSERT INTO agents (agent_id, name, email, skills, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, ['test_agent_123', 'Test Agent', 'test@example.com', ['support', 'sales'], 'available']);

        console.log('✅ Agent created successfully:', testAgent.rows[0]);

        // Clean up
        await db.query('DELETE FROM agents WHERE agent_id = $1', ['test_agent_123']);
        console.log('✅ Test agent deleted');

        await db.pool.end();
        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        await db.pool.end();
        process.exit(1);
    }
}

test();
