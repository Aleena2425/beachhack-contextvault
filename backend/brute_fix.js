import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function bruteFix() {
    try {
        await client.connect();

        const queries = [
            "ALTER TABLE agents ADD COLUMN IF NOT EXISTS sentiment VARCHAR(50) DEFAULT 'neutral'",
            "ALTER TABLE agents ALTER COLUMN sentiment DROP NOT NULL",
            "ALTER TABLE agents ALTER COLUMN sentiment SET DEFAULT 'neutral'",
            "UPDATE agents SET sentiment = 'neutral' WHERE sentiment IS NULL",

            "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS sentiment VARCHAR(50) DEFAULT 'neutral'",
            "ALTER TABLE sessions ALTER COLUMN sentiment DROP NOT NULL",
            "ALTER TABLE sessions ALTER COLUMN sentiment SET DEFAULT 'neutral'",
            "UPDATE sessions SET sentiment = 'neutral' WHERE sentiment IS NULL"
        ];

        for (const q of queries) {
            console.log(`Executing: ${q}`);
            try {
                await client.query(q);
            } catch (e) {
                console.log(`  - Note: ${e.message}`);
            }
        }

        console.log('Brute force fixes applied.');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

bruteFix();
