import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function checkCustomersSchema() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'customers'");
        console.log('CUSTOMERS COLUMNS:');
        res.rows.forEach(r => console.log(` - ${r.column_name}: Nullable=${r.is_nullable}, Type=${r.data_type}`));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkCustomersSchema();
