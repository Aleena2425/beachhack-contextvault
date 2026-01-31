import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function getFunc() {
    try {
        await client.connect();
        const res = await client.query("SELECT proname, prosrc FROM pg_proc WHERE proname = 'update_agents_updated_at'");
        if (res.rows[0]) {
            console.log('FUNCTION SOURCE:');
            console.log(res.rows[0].prosrc);
        } else {
            console.log('Function not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

getFunc();
