import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function getSchema() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'agents'");
        console.log('SCHEMA_START');
        res.rows.forEach(r => {
            console.log(`COL:${r.column_name}|NULL:${r.is_nullable}|DEF:${r.column_default}`);
        });
        console.log('SCHEMA_END');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

getSchema();
