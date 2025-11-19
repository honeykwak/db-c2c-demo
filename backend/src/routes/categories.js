const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/categories
// 단순 Category 목록 조회 (US 2.2 - UI용 전체 목록)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT category_id, category_name, parent_category_id
       FROM category
       ORDER BY category_id`,
    );
    res.json(result.rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching categories', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;


