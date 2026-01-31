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
                relname as table_name
            FROM pg_trigger 
            JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
            WHERE relname IN ('customers', 'customer_profiles', 'sessions', 'messages', 'ai_insights', 'agents')
            AND tgisinternal = false
        `);
        console.log('ACTIVE TRIGGERS:');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkTriggers();
