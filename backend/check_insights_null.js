import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function checkInsightsSchema() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'ai_insights'");
        console.log('INSIGHTS_COLUMNS:');
        res.rows.forEach(r => {
            console.log(`COLUMN: ${r.column_name}, NULLABLE: ${r.is_nullable}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkInsightsSchema();
