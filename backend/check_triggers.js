import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function checkTriggers() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT 
                tgname as trigger_name,
                relname as table_name,
                CASE WHEN tgtype & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END as timing,
                CASE 
                    WHEN tgtype & 4 = 4 THEN 'INSERT'
                    WHEN tgtype & 8 = 8 THEN 'DELETE'
                    WHEN tgtype & 16 = 16 THEN 'UPDATE'
                END as event
            FROM pg_trigger 
            JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
            WHERE relname = 'messages' AND tgisinternal = false
        `);
        console.log('TRIGGERS ON MESSAGES:');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkTriggers();
