const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/chat/rooms?user_id=1 - 사용자의 채팅방 목록
router.get('/rooms', async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const result = await db.query(
      `SELECT cr.*,
              i.title as item_title, i.price as item_price, i.status as item_status,
              buyer.username as buyer_name,
              seller.username as seller_name,
              (SELECT content FROM chat_message WHERE room_id = cr.room_id ORDER BY sent_at DESC LIMIT 1) as last_message,
              (SELECT sent_at FROM chat_message WHERE room_id = cr.room_id ORDER BY sent_at DESC LIMIT 1) as last_message_at
       FROM chat_room cr
       JOIN item i ON cr.item_id = i.item_id
       JOIN users buyer ON cr.buyer_id = buyer.user_id
       JOIN users seller ON cr.seller_id = seller.user_id
       WHERE cr.buyer_id = $1 OR cr.seller_id = $1
       ORDER BY last_message_at DESC NULLS LAST`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching chat rooms', err);
    return res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// POST /api/chat/rooms - 채팅방 생성 또는 기존 채팅방 반환
router.post('/rooms', async (req, res) => {
  const { item_id, buyer_id } = req.body;

  if (!item_id || !buyer_id) {
    return res.status(400).json({ error: 'item_id and buyer_id are required' });
  }

  try {
    // 아이템의 판매자 조회
    const itemResult = await db.query(
      `SELECT seller_id FROM item WHERE item_id = $1`,
      [item_id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const sellerId = itemResult.rows[0].seller_id;

    // 자기 상품에 채팅 불가
    if (sellerId === buyer_id) {
      return res.status(400).json({ error: 'Cannot chat on your own item' });
    }

    // 기존 채팅방 확인
    const existingRoom = await db.query(
      `SELECT * FROM chat_room WHERE item_id = $1 AND buyer_id = $2`,
      [item_id, buyer_id]
    );

    if (existingRoom.rows.length > 0) {
      return res.json(existingRoom.rows[0]);
    }

    // 새 채팅방 생성
    const newRoom = await db.query(
      `INSERT INTO chat_room (item_id, buyer_id, seller_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [item_id, buyer_id, sellerId]
    );

    return res.status(201).json(newRoom.rows[0]);
  } catch (err) {
    console.error('Error creating chat room', err);
    return res.status(500).json({ error: 'Failed to create chat room' });
  }
});

// GET /api/chat/rooms/:roomId - 채팅방 상세 + 메시지 목록
router.get('/rooms/:roomId', async (req, res) => {
  const roomId = Number(req.params.roomId);
  if (!Number.isInteger(roomId)) {
    return res.status(400).json({ error: 'Invalid room id' });
  }

  try {
    // 채팅방 정보
    const roomResult = await db.query(
      `SELECT cr.*,
              i.title as item_title, i.price as item_price, i.status as item_status,
              buyer.username as buyer_name,
              seller.username as seller_name
       FROM chat_room cr
       JOIN item i ON cr.item_id = i.item_id
       JOIN users buyer ON cr.buyer_id = buyer.user_id
       JOIN users seller ON cr.seller_id = seller.user_id
       WHERE cr.room_id = $1`,
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // 메시지 목록
    const messagesResult = await db.query(
      `SELECT cm.*, u.username as sender_name
       FROM chat_message cm
       JOIN users u ON cm.sender_id = u.user_id
       WHERE cm.room_id = $1
       ORDER BY cm.sent_at ASC`,
      [roomId]
    );

    return res.json({
      room: roomResult.rows[0],
      messages: messagesResult.rows
    });
  } catch (err) {
    console.error('Error fetching chat room', err);
    return res.status(500).json({ error: 'Failed to fetch chat room' });
  }
});

// POST /api/chat/rooms/:roomId/messages - 메시지 전송
router.post('/rooms/:roomId/messages', async (req, res) => {
  const roomId = Number(req.params.roomId);
  const { sender_id, content } = req.body;

  if (!Number.isInteger(roomId) || !sender_id || !content) {
    return res.status(400).json({ error: 'sender_id and content are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO chat_message (room_id, sender_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [roomId, sender_id, content]
    );

    // sender_name 추가해서 반환
    const messageWithName = await db.query(
      `SELECT cm.*, u.username as sender_name
       FROM chat_message cm
       JOIN users u ON cm.sender_id = u.user_id
       WHERE cm.message_id = $1`,
      [result.rows[0].message_id]
    );

    return res.status(201).json(messageWithName.rows[0]);
  } catch (err) {
    console.error('Error sending message', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
