import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function checkSchema() {
    try {
        await client.connect();

        console.log('--- MESSAGES SCHEMA ---');
        const res1 = await client.query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'messages'");
        console.log(res1.rows);

        console.log('\n--- AI_INSIGHTS SCHEMA ---');
        const res2 = await client.query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'ai_insights'");
        console.log(res2.rows);

        console.log('\n--- SESSIONS SCHEMA ---');
        const res3 = await client.query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'sessions'");
        console.log(res3.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSchema();
