const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/transactions - 거래 생성 (구매 확정)
router.post('/', async (req, res) => {
  const { item_id, buyer_id, final_price } = req.body;

  if (!item_id || !buyer_id || !final_price) {
    return res.status(400).json({ error: 'item_id, buyer_id, and final_price are required' });
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 아이템 상태 확인
    const itemResult = await client.query(
      `SELECT * FROM item WHERE item_id = $1 FOR UPDATE`,
      [item_id]
    );

    if (itemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = itemResult.rows[0];

    if (item.status !== 'ON_SALE' && item.status !== 'RESERVED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Item is not available for purchase' });
    }

    if (item.seller_id === buyer_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot buy your own item' });
    }

    // 거래 생성
    const transResult = await client.query(
      `INSERT INTO transaction (item_id, buyer_id, final_price)
       VALUES ($1, $2, $3) RETURNING *`,
      [item_id, buyer_id, final_price]
    );

    // 아이템 상태를 SOLD로 변경
    await client.query(
      `UPDATE item SET status = 'SOLD' WHERE item_id = $1`,
      [item_id]
    );

    await client.query('COMMIT');
    return res.status(201).json(transResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating transaction', err);
    return res.status(500).json({ error: 'Failed to create transaction' });
  } finally {
    client.release();
  }
});

// GET /api/transactions/:id - 거래 상세
router.get('/:id', async (req, res) => {
  const transId = Number(req.params.id);
  if (!Number.isInteger(transId)) {
    return res.status(400).json({ error: 'Invalid transaction id' });
  }

  try {
    const result = await db.query(
      `SELECT t.*,
              i.title, i.price as item_price, i.seller_id,
              buyer.username as buyer_name,
              seller.username as seller_name,
              td.seat_info, e.event_name, eo.venue, eo.event_datetime
       FROM transaction t
       JOIN item i ON t.item_id = i.item_id
       JOIN users buyer ON t.buyer_id = buyer.user_id
       JOIN users seller ON i.seller_id = seller.user_id
       LEFT JOIN ticket_details td ON i.item_id = td.item_id
       LEFT JOIN event_option eo ON td.event_option_id = eo.event_option_id
       LEFT JOIN event e ON eo.event_id = e.event_id
       WHERE t.trans_id = $1`,
      [transId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching transaction', err);
    return res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// POST /api/transactions/:id/review - 거래에 대한 리뷰 작성
router.post('/:id/review', async (req, res) => {
  const transId = Number(req.params.id);
  const { reviewer_id, rating, comment } = req.body;

  if (!Number.isInteger(transId) || !reviewer_id || !rating) {
    return res.status(400).json({ error: 'reviewer_id and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // 거래 정보 조회
    const transResult = await db.query(
      `SELECT t.*, i.seller_id
       FROM transaction t
       JOIN item i ON t.item_id = i.item_id
       WHERE t.trans_id = $1`,
      [transId]
    );

    if (transResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const trans = transResult.rows[0];

    // reviewer가 buyer인지 seller인지 확인하고 reviewee 결정
    let revieweeId;
    if (reviewer_id === trans.buyer_id) {
      revieweeId = trans.seller_id; // 구매자가 판매자를 리뷰
    } else if (reviewer_id === trans.seller_id) {
      revieweeId = trans.buyer_id; // 판매자가 구매자를 리뷰
    } else {
      return res.status(400).json({ error: 'You are not part of this transaction' });
    }

    // 이미 리뷰 작성했는지 확인
    const existingReview = await db.query(
      `SELECT * FROM review WHERE trans_id = $1 AND reviewer_id = $2`,
      [transId, reviewer_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this transaction' });
    }

    // 리뷰 생성
    const result = await db.query(
      `INSERT INTO review (trans_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [transId, reviewer_id, revieweeId, rating, comment || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating review', err);
    return res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = router;
