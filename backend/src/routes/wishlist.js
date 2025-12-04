const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/wishlist/:userId - 유저의 찜 목록
router.get('/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const result = await db.query(
      `SELECT w.wishlist_id, w.created_at, i.*,
              td.event_option_id, td.seat_info
       FROM wishlist w
       JOIN item i ON w.item_id = i.item_id
       LEFT JOIN ticket_details td ON i.item_id = td.item_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching wishlist', err);
    return res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// GET /api/wishlist/:userId/check/:itemId - 찜 여부 확인
router.get('/:userId/check/:itemId', async (req, res) => {
  const userId = Number(req.params.userId);
  const itemId = Number(req.params.itemId);

  if (!Number.isInteger(userId) || !Number.isInteger(itemId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const result = await db.query(
      `SELECT wishlist_id FROM wishlist WHERE user_id = $1 AND item_id = $2`,
      [userId, itemId]
    );
    return res.json({ isWished: result.rows.length > 0 });
  } catch (err) {
    console.error('Error checking wishlist', err);
    return res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

// POST /api/wishlist - 찜 추가
router.post('/', async (req, res) => {
  const { user_id, item_id } = req.body;

  if (!user_id || !item_id) {
    return res.status(400).json({ error: 'user_id and item_id are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO wishlist (user_id, item_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, item_id) DO NOTHING
       RETURNING *`,
      [user_id, item_id]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error adding to wishlist', err);
    return res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:userId/:itemId - 찜 삭제
router.delete('/:userId/:itemId', async (req, res) => {
  const userId = Number(req.params.userId);
  const itemId = Number(req.params.itemId);

  if (!Number.isInteger(userId) || !Number.isInteger(itemId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    await db.query(
      `DELETE FROM wishlist WHERE user_id = $1 AND item_id = $2`,
      [userId, itemId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('Error removing from wishlist', err);
    return res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// GET /api/wishlist/count/:itemId - 아이템의 찜 수
router.get('/count/:itemId', async (req, res) => {
  const itemId = Number(req.params.itemId);

  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  try {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM wishlist WHERE item_id = $1`,
      [itemId]
    );
    return res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error counting wishlist', err);
    return res.status(500).json({ error: 'Failed to count wishlist' });
  }
});

module.exports = router;
