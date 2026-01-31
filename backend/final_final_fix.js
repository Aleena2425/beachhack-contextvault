import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function finalFinalFix() {
    try {
        await client.connect();

        // Fix customer_profiles which uses last_sentiment, last_intent, etc.
        const cpFixes = [
            "ALTER TABLE customer_profiles ALTER COLUMN last_sentiment DROP NOT NULL",
            "ALTER TABLE customer_profiles ALTER COLUMN last_sentiment SET DEFAULT 'neutral'",
            "ALTER TABLE customer_profiles ALTER COLUMN last_intent DROP NOT NULL",
            "ALTER TABLE customer_profiles ALTER COLUMN last_intent SET DEFAULT 'unknown'",
            "UPDATE customer_profiles SET last_sentiment = 'neutral' WHERE last_sentiment IS NULL",
            "UPDATE customer_profiles SET last_intent = 'unknown' WHERE last_intent IS NULL"
        ];

        for (const q of cpFixes) {
            console.log(`Executing: ${q}`);
            try {
                await client.query(q);
            } catch (e) {
                console.log(`  - Note: ${e.message}`);
            }
        }

        console.log('Final final fixes applied successfully.');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

finalFinalFix();
