const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/users - 전체 사용자 목록
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_id, username, created_at FROM users ORDER BY user_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - 특정 사용자 정보 + 평균 평점
router.get('/:id', async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const userResult = await db.query(
      `SELECT user_id, username, created_at FROM users WHERE user_id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 받은 리뷰 평균 평점
    const ratingResult = await db.query(
      `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count
       FROM review WHERE reviewee_id = $1`,
      [userId]
    );

    const user = userResult.rows[0];
    user.avg_rating = parseFloat(ratingResult.rows[0].avg_rating).toFixed(1);
    user.review_count = parseInt(ratingResult.rows[0].review_count);

    return res.json(user);
  } catch (err) {
    console.error('Error fetching user', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users/:id/items - 사용자가 판매중인 상품
router.get('/:id/items', async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const result = await db.query(
      `SELECT i.*, sp.product_code, sp.model_name, sp.brand_name,
              td.event_option_id, td.seat_info, td.original_price,
              e.event_name, e.artist_name, eo.venue, eo.event_datetime
       FROM item i
       LEFT JOIN standard_product sp ON i.std_id = sp.std_id
       LEFT JOIN ticket_details td ON i.item_id = td.item_id
       LEFT JOIN event_option eo ON td.event_option_id = eo.event_option_id
       LEFT JOIN event e ON eo.event_id = e.event_id
       WHERE i.seller_id = $1
       ORDER BY i.reg_date DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user items', err);
    return res.status(500).json({ error: 'Failed to fetch user items' });
  }
});

// GET /api/users/:id/purchases - 사용자의 구매 내역
router.get('/:id/purchases', async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const result = await db.query(
      `SELECT t.*, i.title, i.price as original_price, i.seller_id,
              u.username as seller_name,
              td.seat_info, e.event_name, eo.venue, eo.event_datetime
       FROM transaction t
       JOIN item i ON t.item_id = i.item_id
       JOIN users u ON i.seller_id = u.user_id
       LEFT JOIN ticket_details td ON i.item_id = td.item_id
       LEFT JOIN event_option eo ON td.event_option_id = eo.event_option_id
       LEFT JOIN event e ON eo.event_id = e.event_id
       WHERE t.buyer_id = $1
       ORDER BY t.trans_date DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching purchases', err);
    return res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// GET /api/users/:id/reviews - 사용자가 받은 리뷰
router.get('/:id/reviews', async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const result = await db.query(
      `SELECT r.*, u.username as reviewer_name
       FROM review r
       JOIN users u ON r.reviewer_id = u.user_id
       WHERE r.reviewee_id = $1
       ORDER BY r.review_id DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reviews', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
