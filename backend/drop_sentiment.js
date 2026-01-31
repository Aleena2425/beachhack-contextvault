import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function dropSentiment() {
    try {
        await client.connect();

        const tables = [
            { table: 'messages', col: 'sentiment' },
            { table: 'ai_insights', col: 'sentiment' },
            { table: 'agents', col: 'sentiment' },
            { table: 'sessions', col: 'sentiment' },
            { table: 'customer_profiles', col: 'last_sentiment' }
        ];

        for (const item of tables) {
            console.log(`Dropping ${item.table}.${item.col} if exists...`);
            try {
                await client.query(`ALTER TABLE ${item.table} DROP COLUMN IF EXISTS ${item.col} CASCADE`);
                console.log(`  - Success`);
            } catch (e) {
                console.log(`  - Failed: ${e.message}`);
            }
        }

        console.log('Sentiment columns dropped successfully.');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

dropSentiment();
