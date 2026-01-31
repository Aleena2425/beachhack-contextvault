import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function fixSentiment() {
    try {
        await client.connect();

        // Find all tables with sentiment column
        const res = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE column_name = 'sentiment' AND table_schema = 'public'
        `);

        for (const row of res.rows) {
            console.log(`Fixing ${row.table_name}.${row.column_name}...`);
            await client.query(`ALTER TABLE ${row.table_name} ALTER COLUMN sentiment SET DEFAULT 'neutral'`);
            // Also update existing nulls if any (though constraint is NOT NULL, just in case)
            await client.query(`UPDATE ${row.table_name} SET sentiment = 'neutral' WHERE sentiment IS NULL`);
        }

        // Also check for 'intent' and 'urgency' while we are at it, as they often go together
        const res2 = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE column_name IN ('intent', 'urgency') AND table_schema = 'public'
        `);

        for (const row of res2.rows) {
            console.log(`Fixing ${row.table_name}.${row.column_name}...`);
            const defaultValue = row.column_name === 'intent' ? 'unknown' : 'low';
            await client.query(`ALTER TABLE ${row.table_name} ALTER COLUMN ${row.column_name} SET DEFAULT '${defaultValue}'`);
        }

        console.log('Database defaults applied successfully.');
    } catch (err) {
        console.error('Error applying fixes:', err.message);
    } finally {
        await client.end();
    }
}

fixSentiment();
