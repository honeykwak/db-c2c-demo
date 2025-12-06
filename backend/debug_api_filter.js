const BASE_URL = 'http://localhost:4000/api/items';

async function runTests() {
    try {
        console.log('--- Testing Category Filter (Category 4: Smartphone) ---');
        const res = await fetch(`${BASE_URL}?category=4`);
        const data = await res.json();

        console.log(`Status: ${res.status}`);
        console.log(`Count: ${data.length}`);

        if (data.length > 0) {
            // Check first 5 items
            for (let i = 0; i < Math.min(5, data.length); i++) {
                console.log(`[${i}] ID: ${data[i].item_id}, CatID: ${data[i].category_id}, Title: ${data[i].title}`);
                if (data[i].category_id !== 4) {
                    console.error(`🚨 FAIL: Found non-category-4 item! ID ${data[i].item_id} has CatID ${data[i].category_id}`);
                }
            }
        } else {
            console.log('No items found for category 4.');
        }

    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

runTests();
