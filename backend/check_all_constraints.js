import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function findConstraints() {
    try {
        await client.connect();

        console.log('--- ALL CONSTRAINTS ON AGENTS ---');
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'agents'
        `);
        console.log(res.rows);

        console.log('\n--- ALL TRIGGERS ON ALL TABLES ---');
        const res2 = await client.query(`
            SELECT tgname, relname, proname 
            FROM pg_trigger 
            JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
            JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
            WHERE tgisinternal = false
        `);
        console.log(res2.rows);

        console.log('\n--- ALL COLUMNS IN ALL TABLES NAMED SENTIMENT ---');
        const res3 = await client.query(`
            SELECT table_name, column_name, is_nullable 
            FROM information_schema.columns 
            WHERE column_name = 'sentiment'
        `);
        console.log(res3.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

findConstraints();
