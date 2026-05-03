const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);

// POST /api/messages — Send a message
router.post('/', (req, res) => {
  const { receiverId, content, hostelId } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ message: 'receiverId and content are required' });
  }

  db.run(
    'INSERT INTO messages (sender_id, receiver_id, hostel_id, content) VALUES (?, ?, ?, ?)',
    [req.user.id, receiverId, hostelId || null, content],
    function (err) {
      if (err) {
        console.error('Message insert error:', err.message, { sender: req.user.id, receiver: receiverId, hostel: hostelId });
        return res.status(500).json({ message: 'Error sending message' });
      }
      res.status(201).json({
        message: 'Message sent successfully',
        data: {
          id: this.lastID,
          sender_id: req.user.id,
          receiver_id: receiverId,
          hostel_id: hostelId || null,
          content,
          created_at: new Date().toISOString(),
          is_read: 0,
        },
      });
    }
  );
});

// GET /api/messages — Get inbox messages for logged-in user
router.get('/', (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT m.*, 
            s.name as sender_name, s.role as sender_role,
            r.name as receiver_name, r.role as receiver_role
     FROM messages m
     JOIN users s ON m.sender_id = s.id
     JOIN users r ON m.receiver_id = r.id
     WHERE m.sender_id = ? OR m.receiver_id = ?
     ORDER BY m.created_at ASC`,
    [userId, userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching messages' });
      }
      res.json({ messages: rows });
    }
  );
});

// PUT /api/messages/read — Mark messages as read
router.put('/read', (req, res) => {
  const { senderId, hostelId, roomIds } = req.body;
  const userId = req.user.id;

  if (!senderId) {
    return res.status(400).json({ message: 'senderId is required' });
  }

  let query = 'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?';
  let params = [senderId, userId];

  if (roomIds && Array.isArray(roomIds) && roomIds.length > 0) {
    query += ` AND hostel_id IN (${roomIds.map(() => '?').join(',')})`;
    params.push(...roomIds);
  } else if (hostelId) {
    query += ' AND hostel_id = ?';
    params.push(hostelId);
  }

  db.run(query, params, function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error updating messages' });
    }
    res.json({ message: 'Messages marked as read' });
  });
});

module.exports = router;
