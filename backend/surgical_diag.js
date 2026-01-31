import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'contextai'
});

async function diagnostic() {
    try {
        await client.connect();

        const tables = ['customers', 'agents', 'sessions', 'messages', 'ai_insights', 'customer_profiles'];

        for (const table of tables) {
            console.log(`Checking table: ${table}`);
            try {
                // Try a dummy insert with minimal data
                if (table === 'customers') {
                    await client.query("INSERT INTO customers (external_id) VALUES ('test-diag')");
                } else if (table === 'agents') {
                    await client.query("INSERT INTO agents (agent_id, name, email) VALUES ('agent-diag', 'Diag', 'diag@e.com')");
                } else if (table === 'sessions') {
                    // Need a customer
                    const c = await client.query("SELECT id FROM customers LIMIT 1");
                    const a = await client.query("SELECT id FROM agents LIMIT 1");
                    if (c.rows[0] && a.rows[0]) {
                        await client.query("INSERT INTO sessions (customer_id, agent_id) VALUES ($1, $2)", [c.rows[0].id, a.rows[0].id]);
                    }
                } else if (table === 'messages') {
                    const s = await client.query("SELECT id FROM sessions LIMIT 1");
                    if (s.rows[0]) {
                        await client.query("INSERT INTO messages (session_id, sender_type, content) VALUES ($1, 'customer', 'test')", [s.rows[0].id]);
                    }
                }
                console.log(`  - PASS`);
            } catch (e) {
                console.log(`  - FAIL: ${e.message}`);
                console.log(`    Detail: ${e.detail}`);
                console.log(`    Hint: ${e.hint}`);
                console.log(`    Schema: ${e.schema}`);
                console.log(`    Table: ${e.table}`);
                console.log(`    Column: ${e.column}`);
                console.log(`    Constraint: ${e.constraint}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

diagnostic();
