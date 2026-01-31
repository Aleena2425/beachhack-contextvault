import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function checkAgentsSchema() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'agents'");
        console.log('AGENTS COLUMNS:');
        res.rows.forEach(r => console.log(` - ${r.column_name}: Nullable=${r.is_nullable}, Type=${r.data_type}`));

        const res2 = await client.query(`
            SELECT tgname as trigger_name 
            FROM pg_trigger 
            JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
            WHERE relname = 'agents' AND tgisinternal = false
        `);
        console.log('\nTRIGGERS ON AGENTS:');
        console.log(res2.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkAgentsSchema();
