const express = require('express');
const db = require('../db');
const { authenticateToken, roleGuard } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/students - Owner gets all students assigned to their rooms
router.get('/', roleGuard(['owner']), (req, res) => {
  // Students are tracked via users.room_id, not rooms.assigned_student_id
  const query = `
    SELECT u.id, u.name, u.email, u.phone, u.cnic, u.address, u.university, u.emergency_contact, u.emergency_name,
           r.room_number, r.hostel_name, r.id as room_id, r.rate as room_rate,
           u.created_at as enrollment_date,
           COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = u.id AND status != 'paid'), 0) as remaining_fee
    FROM users u
    JOIN rooms r ON u.room_id = r.id
    WHERE r.owner_id = ? AND u.role = 'student'
  `;
  db.all(query, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ students: rows });
  });
});

// PUT /api/students/:id/archive - Owner archives a student (unassigns from room)
router.put('/:id/archive', roleGuard(['owner']), (req, res) => {
  const studentId = req.params.id;

  // Verify this student is in one of this owner's rooms
  db.get(
    'SELECT r.id FROM users u JOIN rooms r ON u.room_id = r.id WHERE u.id = ? AND r.owner_id = ?',
    [studentId, req.user.id],
    (err, room) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (!room) return res.status(404).json({ message: 'Student not found in your rooms' });

      // Clear assignment on users table
      db.run(
        'UPDATE users SET room_id = NULL, hostel_name = NULL WHERE id = ?',
        [studentId],
        function (err) {
          if (err) return res.status(500).json({ message: 'Error archiving student' });

          // Mark room as available if this was the last occupant
          db.run(
            'UPDATE rooms SET status = "available" WHERE id = ? AND (SELECT COUNT(*) FROM users WHERE room_id = ?) = 0',
            [room.id, room.id],
            (err) => {
              if (err) console.error("Error updating room status:", err);
            }
          );

          // Clear chat history between owner and student
          db.run(
            'DELETE FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
            [req.user.id, studentId, studentId, req.user.id],
            (err) => {
              if (err) console.error("Error clearing chat history:", err);
              res.json({ message: 'Student archived successfully (unassigned from room)' });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
