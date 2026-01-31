import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function finalFix() {
    try {
        await client.connect();

        const res = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE column_name = 'sentiment' AND table_schema = 'public'
        `);

        for (const row of res.rows) {
            console.log(`Fixing ${row.table_name}.${row.column_name}...`);
            // Drop NOT NULL and set DEFAULT
            await client.query(`ALTER TABLE ${row.table_name} ALTER COLUMN ${row.column_name} DROP NOT NULL`);
            await client.query(`ALTER TABLE ${row.table_name} ALTER COLUMN ${row.column_name} SET DEFAULT 'neutral'`);
        }

        console.log('Final database fixes applied.');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

finalFix();
