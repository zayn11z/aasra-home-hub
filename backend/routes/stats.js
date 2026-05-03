const express = require('express');
const db = require('../db');
const { authenticateToken, roleGuard } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/stats - Dashboard analytics for owners (FR-09)
router.get('/', roleGuard(['owner']), async (req, res) => {
  const ownerId = req.user.id;

  try {
    // 1. Total and Occupied Rooms
    const roomsStat = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(id) as totalRooms, SUM(CASE WHEN status = "occupied" THEN 1 ELSE 0 END) as occupiedRooms FROM rooms WHERE owner_id = ?', [ownerId], (err, row) => {
        if (err) reject(err);
        else resolve({ total: row.totalRooms || 0, occupied: row.occupiedRooms || 0 });
      });
    });

    // 2. Pending Dues targeting mapped students
    const duesStat = await new Promise((resolve, reject) => {
      db.get(`
        SELECT SUM(p.amount) as pendingDues 
        FROM payments p
        JOIN rooms r ON p.student_id = r.assigned_student_id
        WHERE r.owner_id = ? AND p.status IN ('pending', 'overdue', 'challan_generated')
      `, [ownerId], (err, row) => {
        if (err) reject(err);
        else resolve(row.pendingDues || 0);
      });
    });

    // 3. Active Complaints
    const complaintsStat = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(c.id) as activeComplaints 
        FROM complaints c
        WHERE c.status != 'Resolved' AND c.hostel_name IN (SELECT DISTINCT hostel_name FROM rooms WHERE owner_id = ?)
      `, [ownerId], (err, row) => {
        if (err) reject(err);
        else resolve(row.activeComplaints || 0);
      });
    });

    // 4. Average Rating
    const ratingsStat = await new Promise((resolve, reject) => {
      db.get(`
        SELECT AVG(r.rating) as avgRating 
        FROM reviews r
        WHERE r.hostel_name IN (SELECT DISTINCT hostel_name FROM rooms WHERE owner_id = ?)
      `, [ownerId], (err, row) => {
        if (err) reject(err);
        else resolve(row.avgRating ? Number(row.avgRating).toFixed(1) : "0.0");
      });
    });

    res.json({
      stats: {
        totalRooms: roomsStat.total,
        occupiedRooms: roomsStat.occupied,
        pendingDues: duesStat,
        activeComplaints: complaintsStat,
        averageRating: ratingsStat
      }
    });

  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: 'Error computing analytics' });
  }
});

module.exports = router;
