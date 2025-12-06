const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function runSqlFile(filename) {
    const filePath = path.join(__dirname, '..', 'sql', filename);
    console.log(`Reading SQL file: ${filePath}`);

    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`Executing ${filename}...`);

        // Split by semicolons isn't perfect for complex PL/pgSQL but okay for simple scripts
        // For restoration script with BEGIN/COMMIT, we send it as one block.
        await pool.query(sql);
        console.log(`Successfully executed ${filename}`);
    } catch (err) {
        console.error(`Error executing ${filename}:`, err);
        process.exit(1);
    }
}

async function verify() {
    console.log("Running Verification...");
    const res = await pool.query(`
        SELECT 'Users' as table_name, count(*) as count FROM users
        UNION ALL
        SELECT 'Category', count(*) FROM category
        UNION ALL
        SELECT 'StandardProduct', count(*) FROM standard_product
        UNION ALL
        SELECT 'Event', count(*) FROM event
        UNION ALL
        SELECT 'EventOption', count(*) FROM event_option
        UNION ALL
        SELECT 'Item', count(*) FROM item
        UNION ALL
        SELECT 'TicketDetails', count(*) FROM ticket_details;
    `);
    console.table(res.rows);
}

async function main() {
    try {
        await runSqlFile('restore_demo_data.sql');
        await verify();
    } finally {
        await pool.end();
    }
}

main();
