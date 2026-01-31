import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function findSentiment() {
    try {
        await client.connect();

        console.log('--- TABLES WITH SENTIMENT COLUMN ---');
        const res = await client.query(`
            SELECT table_schema, table_name, column_name, is_nullable 
            FROM information_schema.columns 
            WHERE column_name = 'sentiment'
        `);
        console.log(JSON.stringify(res.rows, null, 2));

        console.log('\n--- CHECK CONSTRAINTS ON THOSE TABLES ---');
        const res2 = await client.query(`
            SELECT tc.table_name, tc.constraint_name, cc.check_clause
            FROM information_schema.table_constraints tc
            JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name IN ('messages', 'ai_insights', 'sessions', 'customers')
        `);
        console.log(JSON.stringify(res2.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

findSentiment();
