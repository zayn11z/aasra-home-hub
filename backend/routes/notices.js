const express = require('express');
const db = require('../db');
const { authenticateToken, roleGuard } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// POST /api/notices - Create a notice (Owner)
router.post('/', roleGuard(['owner']), (req, res) => {
  const { title, content, category, hostelName } = req.body;
  if (!title || !content || !category || !hostelName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO notices (owner_id, hostel_name, title, content, category) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, hostelName, title, content, category],
    function (err) {
      if (err) return res.status(500).json({ message: 'Error creating notice' });
      res.status(201).json({ message: 'Notice published', id: this.lastID });
    }
  );
});

// GET /api/notices - Get notices based on role
router.get('/', (req, res) => {
  if (req.user.role === 'owner') {
    // Owners see all notices they published
    db.all(
      'SELECT * FROM notices WHERE owner_id = ? ORDER BY created_at DESC',
      [req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ notices: rows });
      }
    );
  } else if (req.user.role === 'student') {
    // Students see notices for their hostel that they haven't dismissed
    db.all(
      `SELECT n.* FROM notices n 
       JOIN users u ON u.id = ?
       WHERE n.hostel_name = u.hostel_name 
       AND n.id NOT IN (SELECT notice_id FROM notice_reads WHERE student_id = ?)
       ORDER BY n.created_at DESC`,
      [req.user.id, req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ notices: rows });
      }
    );
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
});

// POST /api/notices/:id/dismiss - Dismiss a notice (Student)
router.post('/:id/dismiss', roleGuard(['student']), (req, res) => {
  db.run(
    'INSERT OR IGNORE INTO notice_reads (notice_id, student_id) VALUES (?, ?)',
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Error dismissing notice' });
      res.json({ message: 'Notice dismissed' });
    }
  );
});

// DELETE /api/notices/:id - Delete a notice (Owner)
router.delete('/:id', roleGuard(['owner']), (req, res) => {
  const noticeId = req.params.id;
  
  // Verify ownership
  db.get('SELECT owner_id FROM notices WHERE id = ?', [noticeId], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!row) return res.status(404).json({ message: 'Notice not found' });
    if (row.owner_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    db.serialize(() => {
      // Delete notice_reads first due to foreign key
      db.run('DELETE FROM notice_reads WHERE notice_id = ?', [noticeId]);
      db.run('DELETE FROM notices WHERE id = ?', [noticeId], function (err) {
        if (err) return res.status(500).json({ message: 'Error deleting notice' });
        res.json({ message: 'Notice deleted' });
      });
    });
  });
});

module.exports = router;
