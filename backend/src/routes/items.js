const express = require('express');
const db = require('../db');

const router = express.Router();

// Helper: build dynamic WHERE and params for GET /api/items
function buildItemsFilterQuery(query) {
  const whereClauses = [];
  const params = [];

  // search: Item.title OR StandardProduct.model_name
  if (query.search) {
    params.push(`%${query.search}%`);
    const idx = params.length;
    whereClauses.push(
      `(i.title ILIKE $${idx} OR sp.model_name ILIKE $${idx})`,
    );
  }

  // category: use recursive CTE to get all descendant categories
  if (query.category) {
    const categoryId = Number(query.category);
    if (Number.isInteger(categoryId)) {
      params.push(categoryId);
      const idx = params.length;
      whereClauses.push(
        `i.category_id IN (
           WITH RECURSIVE category_tree AS (
             SELECT category_id, parent_category_id
             FROM category
             WHERE category_id = $${idx}
             UNION ALL
             SELECT c.category_id, c.parent_category_id
             FROM category c
             INNER JOIN category_tree ct
               ON c.parent_category_id = ct.category_id
           )
           SELECT category_id FROM category_tree
         )`,
      );
    }
  }

  // event_option_id + seat_sector (JSONB)
  if (query.event_option_id) {
    const eventOptionId = Number(query.event_option_id);
    if (Number.isInteger(eventOptionId)) {
      params.push(eventOptionId);
      const idx = params.length;
      whereClauses.push(`td.event_option_id = $${idx}`);
    }
  }

  if (query.seat_sector) {
    params.push(query.seat_sector);
    const idx = params.length;
    whereClauses.push(`td.seat_info ->> 'sector' = $${idx}`);
  }

  // type: 'ticket' or 'product'
  if (query.type === 'ticket') {
    whereClauses.push(`td.event_option_id IS NOT NULL`);
  } else if (query.type === 'product') {
    whereClauses.push(`td.event_option_id IS NULL`);
  }

  // status: 'ON_SALE', 'RESERVED', 'SOLD'
  if (query.status && ['ON_SALE', 'RESERVED', 'SOLD'].includes(query.status)) {
    params.push(query.status);
    const idx = params.length;
    whereClauses.push(`i.status = $${idx}`);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  return { whereSql, params };
}

// GET /api/items
// - 기본: 모든 Item
// - ?search=, ?category=, ?event_option_id=, ?seat_sector=
// - ?page=1&limit=20 (페이지네이션)
router.get('/', async (req, res) => {
  const { whereSql, params } = buildItemsFilterQuery(req.query);

  // 페이지네이션 파라미터
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  // 전체 개수 쿼리
  const countSql = `
    SELECT COUNT(*) as total
    FROM item i
    LEFT JOIN standard_product sp ON i.std_id = sp.std_id
    LEFT JOIN ticket_details td ON i.item_id = td.item_id
    ${whereSql}
  `;

  // 데이터 쿼리
  const dataSql = `
    SELECT
      i.item_id,
      i.title,
      i.price,
      i.status,
      i.category_id,
      i.std_id,
      sp.product_code,
      sp.model_name,
      sp.brand_name,
      td.event_option_id,
      td.seat_info,
      td.original_price
    FROM item i
    LEFT JOIN standard_product sp
      ON i.std_id = sp.std_id
    LEFT JOIN ticket_details td
      ON i.item_id = td.item_id
    ${whereSql}
    ORDER BY i.item_id DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2};
  `;

  try {
    const [countResult, dataResult] = await Promise.all([
      db.query(countSql, params),
      db.query(dataSql, [...params, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      items: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching items', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET /api/items/:id - 아이템 상세 조회
router.get('/:id', async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  try {
    const result = await db.query(
      `SELECT
        i.*,
        u.username as seller_name,
        sp.product_code, sp.model_name, sp.brand_name, sp.specs,
        c.category_name,
        td.event_option_id, td.seat_info, td.original_price,
        e.event_id, e.event_name, e.artist_name,
        eo.venue, eo.event_datetime
      FROM item i
      JOIN users u ON i.seller_id = u.user_id
      LEFT JOIN standard_product sp ON i.std_id = sp.std_id
      LEFT JOIN category c ON i.category_id = c.category_id
      LEFT JOIN ticket_details td ON i.item_id = td.item_id
      LEFT JOIN event_option eo ON td.event_option_id = eo.event_option_id
      LEFT JOIN event e ON eo.event_id = e.event_id
      WHERE i.item_id = $1`,
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching item', err);
    return res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// PATCH /api/items/:id/status - 아이템 상태 변경
router.patch('/:id/status', async (req, res) => {
  const itemId = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  if (!['ON_SALE', 'RESERVED', 'SOLD'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await db.query(
      `UPDATE item SET status = $1 WHERE item_id = $2 RETURNING *`,
      [status, itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating item status', err);
    return res.status(500).json({ error: 'Failed to update item status' });
  }
});

// POST /api/items
// Body 예시 (티켓):
// {
//   "seller_id": 1,
//   "std_id": null,
//   "title": "...",
//   "price": 150000,
//   "category_id": 3,
//   "ticket": {
//     "event_option_id": 10,
//     "seat_info": { "grade": "R", "sector": "A", "row": 10, "number": 5 },
//     "original_price": 130000
//   }
// }
router.post('/', async (req, res) => {
  const {
    seller_id: sellerId = 1,
    std_id: stdId = null,
    title,
    price,
    category_id: categoryId = null,
    ticket,
  } = req.body || {};

  if (!title || !price) {
    return res
      .status(400)
      .json({ error: 'title and price are required fields' });
  }

  // 일반 상품 / SKU 상품: Item만 INSERT
  if (!ticket) {
    try {
      const result = await db.query(
        `INSERT INTO item (seller_id, title, price, std_id, category_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [sellerId, title, price, stdId, categoryId],
      );
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error inserting item', err);
      return res.status(500).json({ error: 'Failed to insert item' });
    }
  }

  // 티켓 상품: Item + TicketDetails 트랜잭션
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const itemResult = await client.query(
      `INSERT INTO item (seller_id, title, price, std_id, category_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING item_id`,
      [sellerId, title, price, stdId, categoryId],
    );
    const itemId = itemResult.rows[0].item_id;

    await client.query(
      `INSERT INTO ticket_details (item_id, event_option_id, seat_info, original_price)
       VALUES ($1, $2, $3, $4)`,
      [
        itemId,
        ticket.event_option_id,
        ticket.seat_info,
        ticket.original_price,
      ],
    );

    await client.query('COMMIT');
    return res.status(201).json({ item_id: itemId });
  } catch (err) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('Error inserting ticket item', err);
    // 트리거 예외 메시지를 그대로 전달
    return res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;


