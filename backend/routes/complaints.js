const express = require('express');
const db = require('../db');
const { authenticateToken, roleGuard } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// POST /api/complaints - Submit a new complaint (Student)
router.post('/', roleGuard(['student']), (req, res) => {
  const { hostelName, category, description } = req.body;
  if (!hostelName || !category || !description) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  db.run(
    'INSERT INTO complaints (student_id, hostel_name, category, description, status) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, hostelName, category, description, 'Pending'],
    function (err) {
      if (err) return res.status(500).json({ message: 'Error submitting complaint' });
      res.status(201).json({ message: 'Complaint submitted successfully', id: this.lastID });
    }
  );
});

// GET /api/complaints - Get complaints (Filters automatically by role)
router.get('/', (req, res) => {
  if (req.user.role === 'student') {
    db.all('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ complaints: rows });
    });
  } else {
    // Owner: see complaints matching their hostel names
    db.all(`
      SELECT c.*, u.name as student_name, r.room_number
      FROM complaints c 
      JOIN users u ON c.student_id = u.id
      LEFT JOIN rooms r ON u.room_id = r.id
      WHERE c.hostel_name IN (SELECT DISTINCT hostel_name FROM rooms WHERE owner_id = ?)
      ORDER BY c.created_at DESC
    `, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ complaints: rows });
    });
  }
});

// PUT /api/complaints/:id/status - Update complaint status (Owner)
router.put('/:id/status', roleGuard(['owner']), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'In Progress', 'Resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  
  db.run('UPDATE complaints SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ message: 'Status updated' });
  });
});

module.exports = router;
