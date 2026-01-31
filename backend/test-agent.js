// Simple agent repository test
import * as agentRepository from './src/data/postgres/repositories/agentRepository.js';
import db from './src/data/postgres/connection.js';

async function test() {
    try {
        console.log('Testing agentRepository.getOrCreate()...\n');

        const result = await agentRepository.getOrCreate('test_agent_999', {
            name: 'Test Agent 999'
        });

        console.log('✅ SUCCESS!');
        console.log('Agent:', result.agent);
        console.log('Is new:', result.isNew);

        // Cleanup
        await db.query('DELETE FROM agents WHERE agent_id = $1', ['test_agent_999']);
        console.log('\n✅ Cleanup complete');

        await db.pool.end();

    } catch (error) {
        console.error('\n❌ ERROR:');
        console.error('Message:', error.message);
        console.error('\nFull error:', error);
        await db.pool.end();
        process.exit(1);
    }
}

test();
