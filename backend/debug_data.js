const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function debug() {
    try {
        console.log('--- 1. Check a Ticket Item ---');
        // Find an item with '콘서트' in title
        const res = await pool.query("SELECT item_id, title, category_id, std_id, price FROM item WHERE title LIKE '%콘서트%' LIMIT 5");
        console.table(res.rows);

        console.log('\n--- 2. Check Category 4 (Smartphone) Items ---');
        // Check what items are in category 4
        const res2 = await pool.query("SELECT item_id, title, category_id FROM item WHERE category_id = 4 LIMIT 5");
        console.table(res2.rows);

        console.log('\n--- 3. Check Recursive Query (Simulation) ---');
        // Simulate what API does for category 1 (Digital)
        const sql = `
            WITH RECURSIVE category_tree AS (
             SELECT category_id, parent_category_id
             FROM category
             WHERE category_id = 1
             UNION ALL
             SELECT c.category_id, c.parent_category_id
             FROM category c
             INNER JOIN category_tree ct
               ON c.parent_category_id = ct.category_id
           )
           SELECT category_id FROM category_tree
        `;
        const res3 = await pool.query(sql);
        console.log('Category 1 Children:', res3.rows.map(r => r.category_id));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

debug();
