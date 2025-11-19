const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/products/autocomplete?q=SM-
// product_code LIKE 검색 (상위 5개)
router.get('/autocomplete', async (req, res) => {
  const q = req.query.q;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    const result = await db.query(
      `SELECT std_id, product_code, brand_name, model_name, specs
       FROM standard_product
       WHERE product_code ILIKE $1
       ORDER BY product_code
       LIMIT 5`,
      [`%${q}%`],
    );
    return res.json(result.rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching product autocomplete', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;


