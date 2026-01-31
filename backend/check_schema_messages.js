import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function checkMessagesSchema() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'messages'");
        console.log('MESSAGES_SCHEMA:');
        for (const row of res.rows) {
            console.log(`- Column: ${row.column_name.padEnd(20)} | Nullable: ${row.is_nullable.padEnd(10)} | Type: ${row.data_type}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkMessagesSchema();
