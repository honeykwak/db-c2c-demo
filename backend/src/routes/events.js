const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT event_id, event_name, artist_name
       FROM event
       ORDER BY event_id`,
    );
    res.json(result.rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching events', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id/options
router.get('/:id/options', async (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const result = await db.query(
      `SELECT event_option_id, event_id, venue, event_datetime
       FROM event_option
       WHERE event_id = $1
       ORDER BY event_option_id`,
      [eventId],
    );
    return res.json(result.rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching event options', err);
    return res.status(500).json({ error: 'Failed to fetch event options' });
  }
});

module.exports = router;


