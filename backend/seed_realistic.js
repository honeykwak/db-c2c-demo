const { Pool } = require('pg');
require('dotenv').config();

// Configuration
const TARGET_USERS = 100;
const TARGET_PRODUCTS = 200;
const TARGET_ITEMS = 2050; // > 2000
const TARGET_TICKETS = 400;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// --- Data Arrays for Realism ---
const FIRST_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
const LAST_NAMES = ['민수', '서준', '도윤', '예준', '시우', '하준', '지호', '지유', '서아', '하윤', '지우', '민서', '서현', '하은', '유나', '주원', '준우', '지아', '서진', '연우'];
const LOCATIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '판교', '분당', '일산'];
const ROLES = ['알뜰', '쿨거래', '네고왕', '직거래', '매너', '칼답'];

const ADJECTIVES = ['S급', '미개봉', '풀박스', '상태좋은', '깨끗한', '기스없는', '급처', '사용감적은', '단순개봉', '선물받은', '해외판', '정품', '리퍼', '부품용', 'A급'];
const CONDITIONS = ['팝니다', '급매', '처분해요', '양도합니다', '가져가세요', '직거래 선호', '택포', '네고가능', '교환X', '빠른거래'];
const DESCRIPTIONS = [
    '선물받았는데 필요없어서 팝니다.',
    '기능 이상 없고 상태 깨끗합니다.',
    '새상품 구하게 되어 판매합니다.',
    '단순 변심으로 내놓습니다.',
    '직거래는 강남역 부근에서 가능합니다.',
    '택배비 포함 가격입니다.',
    '박스랑 구성품 다 포함입니다.',
    '사진 보시는 그대로입니다. 연락주세요.',
    '쿨거래 하시면 네고 조금 해드립니다.',
    '구매 후 몇 번 안썼습니다.',
];

const BRANDS = {
    smartphone: ['Samsung', 'Apple', 'Google', 'Xiaomi'],
    laptop: ['Apple', 'Samsung', 'LG', 'Lenovo', 'Dell', 'HP'],
    audio: ['Sony', 'Bose', 'Apple', 'Samsung', 'JBL'],
};

const MODELS = {
    smartphone: ['Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy Z Flip5', 'Galaxy Z Fold5', 'iPhone 15 Pro', 'iPhone 14', 'iPhone 13 mini', 'Pixel 8', 'Redmi Note 12'],
    laptop: ['MacBook Pro M3', 'MacBook Air M2', 'Galaxy Book 4 Pro', 'LG Gram 17', 'ThinkPad X1', 'XPS 15', 'Spectre x360'],
    audio: ['WH-1000XM5', 'WF-1000XM5', 'AirPods Pro 2', 'Galaxy Buds2 Pro', 'Bose QC Ultra', 'JBL Flip 6'],
};

const CONCERT_ARTISTS = ['아이유', '싸이', '임영웅', '성시경', '뉴진스', 'IVE', '세븐틴', 'BTS', '블랙핑크', 'Day6'];
const SPORTS_TEAMS = ['T1', 'Gen.G', 'FC서울', '롯데 자이언츠', '기아 타이거즈', '두산 베어스', 'LA 다저스', '토트넘'];

// --- Helper Functions ---
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPrice = (min, max) => Math.floor(randomInt(min, max) / 1000) * 1000;

async function runQuery(text, params) {
    return pool.query(text, params);
}

async function main() {
    console.log('🚀 Starting Realistic Data Seeding...');

    try {
        // 1. CLEANUP
        console.log('🧹 Truncating tables...');
        await runQuery(`
      TRUNCATE TABLE 
        users, category, standard_product, event, event_option, 
        item, ticket_details, transaction, review, chat_room, chat_message
      RESTART IDENTITY CASCADE;
    `);

        // 2. INSERT PRE-DEFINED SCENARIO DATA (MANDATORY)
        console.log('🎭 Inserting Scenario Data (A, B, C, D)...');

        // Users (ID 1, 2 reserved)
        await runQuery(`INSERT INTO users (username) VALUES ('demo_seller'), ('demo_buyer')`);

        // Categories
        await runQuery(`
      INSERT INTO category (category_name, parent_category_id) VALUES
      ('디지털기기', NULL), ('생활가전', NULL), ('티켓/교환권', NULL), -- 1,2,3
      ('스마트폰', 1), ('노트북', 1), ('오디오/헤드폰', 1),             -- 4,5,6
      ('콘서트', 3), ('스포츠', 3), ('뮤지컬/연극', 3);                -- 7,8,9
    `);

        // Scenario Standard Products
        await runQuery(`
      INSERT INTO standard_product (product_code, brand_name, model_name, specs, category_id) VALUES
      ('SM-R177', 'Samsung', 'Galaxy Buds2', '{"color": "white", "bluetooth": "5.2"}', 6),
      ('SM-F731N', 'Samsung', 'Galaxy Z Flip5', '{"color": "mint", "storage": "256GB"}', 4),
      ('M3-PRO-14', 'Apple', 'MacBook Pro 14 M3', '{"chip": "M3 Pro", "memory": "18GB"}', 5);
    `);

        // Scenario Events & Options
        await runQuery(`
      INSERT INTO event (event_name, artist_name) VALUES
      ('싸이 흠뻑쇼 2025', '싸이'),
      ('아이유 콘서트 2025', '아이유');
    `);
        await runQuery(`
      INSERT INTO event_option (event_id, venue, event_datetime) VALUES
      (1, '서울 잠실주경기장', '2025-07-20 18:42:00'),
      (1, '부산 아시아드', '2025-07-27 18:42:00'),
      (2, '서울 월드컵경기장', '2025-09-20 19:00:00');
    `);

        // Scenario Items (Specific IDs needed? No, but needs to be first for easier tracking)
        // Item 1: Ticket Filter Target
        const res1 = await runQuery(`
      INSERT INTO item (seller_id, title, price, status, description, category_id, std_id) 
      VALUES (1, '싸이 흠뻑쇼 서울 막콘 R석 A구역 양도합니다', 150000, 'ON_SALE', '못가게 되어 급처합니다.', 7, NULL) RETURNING item_id;
    `);
        await runQuery(`
      INSERT INTO ticket_details (item_id, event_option_id, seat_info, original_price) 
      VALUES ($1, 1, '{"grade": "R", "sector": "A", "row": 10, "number": 15}', 130000)
    `, [res1.rows[0].item_id]);

        // Item 2: Ticket Non-target
        const res2 = await runQuery(`
      INSERT INTO item (seller_id, title, price, status, description, category_id, std_id) 
      VALUES (1, '싸이 흠뻑쇼 부산 S석 C구역', 120000, 'ON_SALE', '친구랑 자리 따로 앉게 되어 팝니다.', 7, NULL) RETURNING item_id;
    `);
        await runQuery(`
      INSERT INTO ticket_details (item_id, event_option_id, seat_info, original_price) 
      VALUES ($1, 2, '{"grade": "S", "sector": "C", "row": 5, "number": 22}', 110000)
    `, [res2.rows[0].item_id]);

        // Item 3: Standard Product Item
        await runQuery(`
      INSERT INTO item (seller_id, title, price, status, description, category_id, std_id) 
      VALUES (1, '갤럭시 Z플립5 민트 S급 팝니다', 850000, 'ON_SALE', '박스 풀구성입니다.', 4, 2);
    `);


        // 3. BULK GENERATION - USERS
        console.log(`bustling... Generating ${TARGET_USERS} Users...`);
        const userValues = [];
        for (let i = 0; i < TARGET_USERS; i++) {
            const name = `${pick(LOCATIONS)}${pick(ROLES)}${pick(FIRST_NAMES)}${pick(LAST_NAMES)}`;
            userValues.push(`('${name}')`);
        }
        // Batch insert users
        // Need to handle large inserts, but 100 is fine in one go.
        // However, Node requires parameter binding or careful string construction.
        // For simplicity in seeding script, we'll do chunks or direct string (safe internal script).
        for (let i = 0; i < userValues.length; i += 50) {
            const chunk = userValues.slice(i, i + 50).join(',');
            await runQuery(`INSERT INTO users (username) VALUES ${chunk}`);
        }


        // 4. BULK GENERATION - STANDARD PRODUCTS
        console.log(`🏭 Generating ${TARGET_PRODUCTS} Standard Products...`);
        const stdValues = [];
        let stdCount = 3; // Started from 3
        for (let i = 0; i < TARGET_PRODUCTS; i++) {
            const catKeys = Object.keys(BRANDS);
            const catKey = pick(catKeys);
            const brand = pick(BRANDS[catKey]);
            const model = pick(MODELS[catKey]);
            const code = `${brand.substring(0, 2).toUpperCase()}-${randomInt(1000, 9999)}-${randomInt(10, 99)}`; // Fake SKU
            const spec = JSON.stringify({ color: pick(['Black', 'White', 'Silver', 'Graphite']), year: randomInt(2021, 2024) });

            let catId = 4; // smartphone
            if (catKey === 'laptop') catId = 5;
            if (catKey === 'audio') catId = 6;

            // Use parameterized query for safety/simplicity in loop via helper or constructing huge string
            // Constructing string for speed
            stdValues.push(`('${code}', '${brand}', '${model}', '${spec}', ${catId})`);
            stdCount++;
        }

        // Split into chunks of 50
        const chunkSize = 50;
        for (let i = 0; i < stdValues.length; i += chunkSize) {
            const chunk = stdValues.slice(i, i + chunkSize);
            await runQuery(`INSERT INTO standard_product (product_code, brand_name, model_name, specs, category_id) VALUES ${chunk.join(', ')}`);
        }


        // 5. BULK GENERATION - ITEMS & TICKETS
        console.log(`📦 Generating ${TARGET_ITEMS} Items (including tickets)...`);

        // First, create more events for tickets
        const eventIds = [1, 2];
        for (const artist of CONCERT_ARTISTS) {
            if (artist === '싸이' || artist === '아이유') continue;
            const res = await runQuery(`INSERT INTO event (event_name, artist_name) VALUES ('${artist} 콘서트 2025', '${artist}') RETURNING event_id`);
            const newEventId = res.rows[0].event_id;
            eventIds.push(newEventId);

            // Add options
            await runQuery(`INSERT INTO event_option (event_id, venue, event_datetime) VALUES (${newEventId}, '${pick(['체조경기장', '고척돔', '잠실', '상암'])}', '2025-10-${randomInt(10, 30)} 19:00:00')`);
        }

        // Refresh option IDs
        const optionRes = await runQuery('SELECT event_option_id, event_id FROM event_option');
        const optionIds = optionRes.rows.map(r => r.event_option_id);

        // Fetch Standard Product IDs for linking
        const stdRes = await runQuery('SELECT std_id, model_name, category_id FROM standard_product');
        const stdProducts = stdRes.rows;

        // Optimized Batch Insertion for Items
        const BATCH_SIZE = 50;
        let currentBatchItems = [];

        let itemCount = 0; // Reset count logic for loop replacement

        // Helper to generate one item object
        const generateItemData = (index) => {
            const isTicket = index < TARGET_TICKETS;
            const sellerId = randomInt(1, TARGET_USERS + 2);
            let title, price, catId, stdId = 'NULL';
            let ticketData = null;

            if (isTicket) {
                const artist = pick(CONCERT_ARTISTS);
                const location = pick(['서울', '부산', '대구', '인천']);
                const seatGrade = pick(['VIP', 'R', 'S', 'A']);
                title = `${artist} 콘서트 ${location} ${seatGrade}석 ${pick(CONDITIONS)}`;
                price = randomPrice(50000, 200000);
                catId = 7;

                const optId = pick(optionIds);
                const originalPrice = Math.floor(price * 0.9);
                const seatInfo = JSON.stringify({
                    grade: pick(['VIP', 'R', 'S', 'A']),
                    sector: pick(['A', 'B', 'C', 'D', 'E']),
                    row: randomInt(1, 30),
                    number: randomInt(1, 40)
                });
                ticketData = { optId, originalPrice, seatInfo };
            } else {
                const prod = pick(stdProducts);
                title = `${pick(ADJECTIVES)} ${prod.model_name} ${pick(CONDITIONS)}`;
                price = randomPrice(100000, 2000000);
                catId = prod.category_id;
                stdId = prod.std_id;
            }
            const description = pick(DESCRIPTIONS);

            return { sellerId, title, price, description, catId, stdId, ticketData };
        };

        console.log(`⚡ Optimized Batch Generation for ${TARGET_ITEMS} Items...`);

        // Loop until target reached
        while (itemCount < TARGET_ITEMS) {
            const itemData = generateItemData(itemCount);
            currentBatchItems.push(itemData);
            itemCount++;

            // If batch full or last item
            if (currentBatchItems.length === BATCH_SIZE || itemCount === TARGET_ITEMS) {
                // Construct Query
                // INSERT INTO item (...) VALUES (...), (...) RETURNING item_id
                // We need to map values to string literals carefully
                const valStrings = currentBatchItems.map(i =>
                    `(${i.sellerId}, '${i.title.replace(/'/g, "''")}', ${i.price}, 'ON_SALE', '${i.description.replace(/'/g, "''")}', ${i.catId}, ${i.stdId})`
                );

                const query = `
                INSERT INTO item (seller_id, title, price, status, description, category_id, std_id) 
                VALUES ${valStrings.join(', ')} 
                RETURNING item_id
            `;

                const res = await pool.query(query);
                const newIds = res.rows.map(r => r.item_id); // Array of new IDs in order

                // Handle Tickets for this batch
                // Map the returned IDs back to the batch items to find which ones were tickets
                const ticketsToInsert = [];

                for (let k = 0; k < currentBatchItems.length; k++) {
                    if (currentBatchItems[k].ticketData) {
                        ticketsToInsert.push({
                            itemId: newIds[k],
                            ...currentBatchItems[k].ticketData
                        });
                    }
                }

                if (ticketsToInsert.length > 0) {
                    const ticketValStrings = ticketsToInsert.map(t =>
                        `(${t.itemId}, ${t.optId}, '${t.seatInfo.replace(/'/g, "''")}', ${t.originalPrice})`
                    );
                    await pool.query(`
                    INSERT INTO ticket_details (item_id, event_option_id, seat_info, original_price)
                    VALUES ${ticketValStrings.join(', ')}
                 `);
                }

                process.stdout.write('.');
                currentBatchItems = []; // clear batch
            }
        }
        console.log('\n');

        console.log('✅ Data Seeding Completed Successfully!');

    } catch (err) {
        console.error('❌ Seeding Failed:', err);
    } finally {
        pool.end();
    }
}

main();
