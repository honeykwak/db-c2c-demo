const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function verify() {
    try {
        console.log('🔍 Verifying Data Consistency...');

        // Check Standard Products
        const res = await pool.query(`
            SELECT brand_name, model_name 
            FROM standard_product 
            ORDER BY brand_name, model_name
        `);

        let errors = 0;
        const validMap = {
            'Samsung': ['Galaxy'],
            'Apple': ['iPhone', 'MacBook', 'AirPods'],
            'Xiaomi': ['Redmi', '13T'],
            'Google': ['Pixel'],
            'Sony': ['XM5'],
            'LG': ['Gram'],
            'Lenovo': ['ThinkPad', 'Legion'],
            'Bose': ['QC']
        };

        const violations = [];

        res.rows.forEach(row => {
            const brand = row.brand_name;
            const model = row.model_name;

            let isValid = false;
            if (validMap[brand]) {
                for (const keyword of validMap[brand]) {
                    if (model.includes(keyword)) isValid = true;
                }
            }

            if (!isValid) {
                violations.push(`${brand} -> ${model}`);
                errors++;
            }
        });

        if (errors === 0) {
            console.log('✅ Standard Product Consistency Check PASSED');
        } else {
            console.error('❌ Standard Product Consistency Check FAILED');
            console.error('Violations:', violations.slice(0, 10)); // Show first 10
        }

        // Check Items match their Standard Product Brand
        const itemRes = await pool.query(`
            SELECT i.title, sp.brand_name 
            FROM item i 
            JOIN standard_product sp ON i.std_id = sp.std_id 
            LIMIT 50
        `);

        console.log('\n--- Random Item Sample ---');
        itemRes.rows.slice(0, 5).forEach(r => console.log(`[${r.brand_name}] ${r.title}`));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

verify();
