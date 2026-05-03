const express = require('express');
const db = require('../db');
const { authenticateToken, roleGuard } = require('../middleware/auth');

const router = express.Router();

// ── IMPORTANT: Specific named routes MUST come before wildcard param routes ──

// GET /api/reviews/check-monthly - Check if student already rated this hostel this month
router.get('/check-monthly', authenticateToken, roleGuard(['student']), (req, res) => {
  const hostelName = req.query.hostelName;
  if (!hostelName) return res.json({ alreadyRated: false });

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  db.get(
    'SELECT id FROM reviews WHERE student_id = ? AND hostel_name = ? AND created_at >= ?',
    [req.user.id, hostelName, monthStart],
    (err, row) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ alreadyRated: !!row });
    }
  );
});

// GET /api/reviews/owner-details - Get per-hostel breakdown for the logged-in owner
router.get('/owner-details', authenticateToken, roleGuard(['owner']), (req, res) => {
  const ownerId = req.user.id;

  db.all(
    'SELECT DISTINCT hostel_name FROM rooms WHERE owner_id = ?',
    [ownerId],
    (err, hostelRows) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      const hostelNames = hostelRows.map((r) => r.hostel_name);
      if (hostelNames.length === 0) {
        return res.json({ hostels: [] });
      }

      const placeholders = hostelNames.map(() => '?').join(',');

      db.all(
        `SELECT * FROM reviews WHERE hostel_name IN (${placeholders}) ORDER BY created_at DESC`,
        hostelNames,
        (err, reviews) => {
          if (err) return res.status(500).json({ message: 'Database error' });

          const hostelMap = {};
          hostelNames.forEach((name) => {
            hostelMap[name] = {
              hostel_name: name,
              avgRating: 0,
              totalReviews: 0,
              avgCleanliness: 0,
              avgFood: 0,
              avgStaff: 0,
              avgFacilities: 0,
              avgSecurity: 0,
              comments: [],
            };
          });

          reviews.forEach((r) => {
            const h = hostelMap[r.hostel_name];
            if (!h) return;
            h.totalReviews++;
            h.avgRating += r.rating || 0;
            h.avgCleanliness += r.cleanliness || 0;
            h.avgFood += r.food || 0;
            h.avgStaff += r.staff || 0;
            h.avgFacilities += r.facilities || 0;
            h.avgSecurity += r.security || 0;
            if (r.review_text) {
              h.comments.push({ text: r.review_text, date: r.created_at, rating: r.rating });
            }
          });

          Object.values(hostelMap).forEach((h) => {
            if (h.totalReviews > 0) {
              h.avgRating = Number((h.avgRating / h.totalReviews).toFixed(1));
              h.avgCleanliness = Number((h.avgCleanliness / h.totalReviews).toFixed(1));
              h.avgFood = Number((h.avgFood / h.totalReviews).toFixed(1));
              h.avgStaff = Number((h.avgStaff / h.totalReviews).toFixed(1));
              h.avgFacilities = Number((h.avgFacilities / h.totalReviews).toFixed(1));
              h.avgSecurity = Number((h.avgSecurity / h.totalReviews).toFixed(1));
            }
          });

          res.json({ hostels: Object.values(hostelMap) });
        }
      );
    }
  );
});

// GET /api/reviews - Get all reviews (Public)
router.get('/', (req, res) => {
  db.all('SELECT * FROM reviews ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ reviews: rows });
  });
});

// GET /api/reviews/hostel/:hostelName - Get stats for a specific hostel (Public)
// NOTE: This MUST remain after the named routes above, otherwise :hostelName
// would match "check-monthly" and "owner-details" before they can be reached.
router.get('/hostel/:hostelName', (req, res) => {
  const { hostelName } = req.params;
  db.get('SELECT AVG(rating) as avgRating, COUNT(id) as totalReviews FROM reviews WHERE hostel_name = ?', [hostelName], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ stats: row });
  });
});

// POST /api/reviews - Submit review (Student, once per month per hostel)
router.post('/', authenticateToken, roleGuard(['student']), (req, res) => {
  const { hostelName, rating, reviewText, cleanliness, food, staff, facilities, security } = req.body;
  if (!hostelName || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Valid rating required' });
  }

  // Check if student already rated this hostel this month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  db.get(
    'SELECT id FROM reviews WHERE student_id = ? AND hostel_name = ? AND created_at >= ?',
    [req.user.id, hostelName, monthStart],
    (err, existing) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (existing) {
        return res.status(429).json({ message: 'You have already rated this hostel this month. Please try again next month.' });
      }

      // Delete previous ratings from this student for this hostel (older months)
      db.run(
        'DELETE FROM reviews WHERE student_id = ? AND hostel_name = ?',
        [req.user.id, hostelName],
        function (err) {
          if (err) return res.status(500).json({ message: 'Database error' });

          db.run(
            'INSERT INTO reviews (student_id, hostel_name, rating, review_text, cleanliness, food, staff, facilities, security) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, hostelName, rating, reviewText || null, cleanliness || null, food || null, staff || null, facilities || null, security || null],
            function (err) {
              if (err) return res.status(500).json({ message: 'Error submitting review' });
              res.status(201).json({ message: 'Review submitted successfully' });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
