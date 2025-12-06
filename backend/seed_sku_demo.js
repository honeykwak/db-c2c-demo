const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function seedSkuDemo() {
    try {
        console.log('🌱 Seeding SKU Demo Items (Vague Titles)...');

        // 1. Get Standard Product IDs
        const res = await pool.query("SELECT std_id, model_name, category_id FROM standard_product WHERE model_name IN ('Galaxy S24', 'iPhone 15 Pro', 'MacBook Pro M3')");
        const stdMap = {};
        res.rows.forEach(r => stdMap[r.model_name] = r);

        if (Object.keys(stdMap).length === 0) {
            console.error("❌ Standard Products not found! Run seed_realistic.js first.");
            return;
        }

        const items = [
            {
                title: '선물받은거 미개봉 급처합니다',
                price: 1000000,
                stdKey: 'Galaxy S24', // User searches "S24", finds this
                desc: '갤S24입니다. 뜯지도 않았어요.'
            },
            {
                title: '여친이랑 헤어져서 팝니다...(네고X)',
                price: 1200000,
                stdKey: 'iPhone 15 Pro', // User searches "iPhone", finds this
                desc: '아이폰 15 프로입니다. 꼴보기도 싫네요.'
            },
            {
                title: '이민가게 되어서 급하게 처분해요',
                price: 2000000,
                stdKey: 'MacBook Pro M3', // User searches "MacBook", finds this
                desc: '맥북 프로 M3 깡통입니다. 상태 좋아요.'
            }
        ];

        for (const item of items) {
            const std = stdMap[item.stdKey];
            if (!std) continue;

            await pool.query(
                `INSERT INTO item (seller_id, title, price, std_id, category_id, description, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'ON_SALE')`,
                [1, item.title, item.price, std.std_id, std.category_id, item.desc] // std_id LINK is key
            );
            console.log(`✅ Inserted: "${item.title}" linked to ${item.stdKey}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

seedSkuDemo();
