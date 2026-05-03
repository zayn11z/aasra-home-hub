const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All payment routes require authentication
router.use(authenticateToken);

// POST /api/payments — Record a fee payment
router.post('/', (req, res) => {
  const { studentId, amount, date, month } = req.body;

  if (!studentId || amount === undefined || !date) {
    return res.status(400).json({ message: 'studentId, amount, and date are required' });
  }

  // TC-07: Validate amount > 0
  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than zero' });
  }

  db.run(
    'INSERT INTO payments (student_id, amount, date, month, payment_method, status, receipt_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [studentId, amount, date, month || null, null, 'pending', null],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error recording payment' });
      }
      res.status(201).json({
        message: 'Fee bill created successfully',
        payment: {
          id: this.lastID,
          student_id: studentId,
          amount,
          date,
          month: month || null,
          payment_method: null,
          status: 'pending',
          receipt_id: null,
        },
      });
    }
  );
});

// POST /api/payments/book — Unified booking + payment endpoint for students
router.post('/book', (req, res) => {
  const { roomId, amount, paymentMethod } = req.body;
  
  if (!roomId || !amount || !paymentMethod) {
    return res.status(400).json({ message: 'roomId, amount, and paymentMethod are required' });
  }

  // Check if room is available
  db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status === 'occupied') return res.status(400).json({ message: 'Room is already full' });

    // Validate payment amount conceptually
    if (amount < room.rate) {
      return res.status(400).json({ message: 'Payment amount is less than room rate' });
    }

    // Check current occupancy
    db.get('SELECT COUNT(*) as count FROM users WHERE room_id = ?', [roomId], (err, row) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      
      if (row.count >= room.capacity) {
        return res.status(400).json({ message: 'Room is already full' });
      }

      const receiptId = 'RCP-' + Date.now();
      const dateStr = new Date().toISOString().split('T')[0];
      const monthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

      db.run(
        'INSERT INTO payments (student_id, amount, date, month, payment_method, status, receipt_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, amount, dateStr, monthStr, paymentMethod, 'paid', receiptId],
        function (err) {
          if (err) return res.status(500).json({ message: 'Error recording payment' });

          // Assign student to the room
          db.run(
            'UPDATE users SET room_id = ?, hostel_name = ? WHERE id = ?',
            [roomId, room.hostel_name, req.user.id],
            function (err) {
              if (err) return res.status(500).json({ message: 'Error assigning room' });

              // If full, mark room as occupied
              if (row.count + 1 >= room.capacity) {
                db.run('UPDATE rooms SET status = ? WHERE id = ?', ['occupied', roomId]);
              }

              res.status(201).json({
                message: 'Booking and payment successful',
                receipt_id: receiptId
              });
            }
          );
        }
      );
    });
  });
});

// GET /api/payments — Get payment history
// TC-09: if student, only their own payments; owners see all
router.get('/', (req, res) => {
  let query, params;

  if (req.user.role === 'student') {
    // Students see only their own payments
    query = `
      SELECT p.*, u.name as student_name, u.id as student_id, u.hostel_name as user_hostel_name, r.room_number 
      FROM payments p 
      JOIN users u ON p.student_id = u.id 
      LEFT JOIN rooms r ON u.room_id = r.id 
      WHERE p.student_id = ? 
      ORDER BY p.created_at DESC
    `;
    params = [req.user.id];
  } else {
    // Owners see all payments
    query = `
      SELECT p.*, u.name as student_name, u.id as student_id, u.hostel_name as user_hostel_name, r.room_number 
      FROM payments p 
      JOIN users u ON p.student_id = u.id 
      LEFT JOIN rooms r ON u.room_id = r.id 
      ORDER BY p.created_at DESC
    `;
    params = [];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching payments' });
    }
    res.json({ payments: rows });
  });
});

// PUT /api/payments/:id/pay — Fulfill an unpaid fee via Challan or Card Processing
router.put('/:id/pay', (req, res) => {
  const { paymentMethod } = req.body;
  const paymentId = req.params.id;

  if (!paymentMethod || !['card', 'challan'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Valid paymentMethod (card or challan) is required' });
  }

  db.get('SELECT * FROM payments WHERE id = ?', [paymentId], (err, payment) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    
    // Students can only pay their own fees; owners theoretically could update any.
    if (req.user.role === 'student' && payment.student_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Already marked as paid' });
    }

    const newStatus = paymentMethod === 'card' ? 'paid' : 'challan_generated';
    let receiptId = payment.receipt_id;
    if (newStatus === 'paid' && !receiptId) {
      receiptId = 'RCP-' + Date.now();
    }

    db.run(
      'UPDATE payments SET status = ?, payment_method = ?, receipt_id = ? WHERE id = ?',
      [newStatus, paymentMethod, receiptId, paymentId],
      function (err) {
        if (err) return res.status(500).json({ message: 'Error updating payment' });
        res.json({
          message: 'Payment updated successfully',
          status: newStatus,
          payment_method: paymentMethod,
          receipt_id: receiptId
        });
      }
    );
  });
});

module.exports = router;
