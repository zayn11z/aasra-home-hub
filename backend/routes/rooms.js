const express = require('express');
const db = require('../db');
const { authenticateToken, roleGuard } = require('../middleware/auth');

const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'uploads/rooms') : path.join(__dirname, '../uploads/rooms');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

// POST /api/rooms — Create a room (owner only)
router.post('/', authenticateToken, roleGuard(['owner']), upload.array('images', 5), (req, res) => {
  const { hostel_name, hostel_location, hostel_type, room_number, room_type, capacity, rate, amenities } = req.body;

  if (!room_number || !rate || !hostel_name || !hostel_location || !hostel_type) {
    return res.status(400).json({ message: 'Hostel name, location, type, room number and rate are required' });
  }

  const type = room_type || 'Single';
  const cap = capacity || 1;
  let ams = '[]';
  if (amenities) {
    try {
      ams = JSON.stringify(JSON.parse(amenities)); // try parse if stringified JSON array
    } catch {
      ams = JSON.stringify(typeof amenities === 'string' ? amenities.split(',') : amenities);
    }
  }

  const uploadedImages = req.files ? req.files.map(f => `/uploads/rooms/${f.filename}`) : [];
  const imagesJson = JSON.stringify(uploadedImages);

  db.run(
    'INSERT INTO rooms (hostel_name, hostel_location, hostel_type, room_number, room_type, capacity, rate, owner_id, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [hostel_name, hostel_location, hostel_type, room_number, type, cap, rate, req.user.id, ams, imagesJson],
    function (err) {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ message: 'Error creating room' });
      }
      res.status(201).json({
        message: 'Room created successfully',
        room: {
          id: this.lastID,
          hostel_name,
          room_number,
          room_type: type,
          capacity: cap,
          rate,
          status: 'available',
          owner_id: req.user.id,
          amenities: JSON.parse(ams),
          images: uploadedImages,
          hostel_location,
          hostel_type,
        },
      });
    }
  );
});

// GET /api/rooms/my-room — Get the assigned room for a student
router.get('/my-room', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can have an assigned room' });
  }

  db.get('SELECT r.*, o.name as owner_name, o.phone as owner_phone FROM rooms r JOIN users u ON r.id = u.room_id LEFT JOIN users o ON r.owner_id = o.id WHERE u.id = ?', [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!row) return res.status(404).json({ message: 'No room assigned yet' });
    row.amenities = row.amenities ? JSON.parse(row.amenities) : [];
    row.images = row.images ? JSON.parse(row.images) : [];
    res.json({ room: row });
  });
});

// GET /api/rooms — List rooms
router.get('/', (req, res) => {
  let query, params;
  let user = null;

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try { 
      // Optional verification
      const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
      user = jwt.verify(token, JWT_SECRET); 
    } catch (err) {}
  }

  if (user && user.role === 'owner') {
    // Owners see only their own rooms
    query = 'SELECT r.*, o.name as owner_name, o.phone as owner_phone, (SELECT COUNT(*) FROM users u WHERE u.room_id = r.id) as current_occupancy FROM rooms r JOIN users o ON r.owner_id = o.id WHERE r.owner_id = ?';
    params = [user.id];
  } else {
    // Students and Unauthenticated Guests see all rooms
    query = 'SELECT r.*, o.name as owner_name, o.phone as owner_phone, (SELECT COUNT(*) FROM users u WHERE u.room_id = r.id) as current_occupancy FROM rooms r JOIN users o ON r.owner_id = o.id';
    params = [];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching rooms' });
    }
    const parsedRows = rows.map(r => ({ 
      ...r, 
      amenities: r.amenities ? JSON.parse(r.amenities) : [],
      images: r.images ? JSON.parse(r.images) : []
    }));
    res.json({ rooms: parsedRows });
  });
});

// PUT /api/rooms/:id/assign — Assign a student to a room (owner only)
router.put('/:id/assign', authenticateToken, roleGuard(['owner']), (req, res) => {
  const { studentId } = req.body;
  const roomId = req.params.id;

  if (!studentId) {
    return res.status(400).json({ message: 'studentId is required' });
  }

  // Ownership check: WHERE id = ? AND owner_id = req.user.id
  db.get(
    'SELECT * FROM rooms WHERE id = ? AND owner_id = ?',
    [roomId, req.user.id],
    (err, room) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (!room) return res.status(404).json({ message: 'Room not found or you do not own this room' });
      if (room.status === 'occupied') return res.status(400).json({ message: 'Room is already full' });

      // Check current occupancy
      db.get('SELECT COUNT(*) as count FROM users WHERE room_id = ?', [roomId], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        
        if (row.count >= room.capacity) {
           return res.status(400).json({ message: 'Room is already full' });
        }

        db.run('UPDATE users SET room_id = ?, hostel_name = ? WHERE id = ?', [roomId, room.hostel_name, studentId], (err) => {
          if (err) return res.status(500).json({ message: 'Error assigning student to room' });

          // If this student fills the room, mark it occupied
          if (row.count + 1 >= room.capacity) {
            db.run('UPDATE rooms SET status = ? WHERE id = ?', ['occupied', roomId]);
          }

          res.json({
            message: 'Student assigned successfully',
            room: {
              id: parseInt(roomId),
              status: (row.count + 1 >= room.capacity) ? 'occupied' : 'available',
            },
          });
        });
      });
    }
  );
});

// PUT /api/rooms/:id — Edit a room (owner only, cannot reduce capacity below occupancy)
router.put('/:id', authenticateToken, roleGuard(['owner']), upload.array('images', 5), (req, res) => {
  const roomId = req.params.id;
  const { room_number, room_type, capacity, rate, amenities, hostel_location, hostel_type, existing_images } = req.body;

  // Verify ownership
  db.get('SELECT * FROM rooms WHERE id = ? AND owner_id = ?', [roomId, req.user.id], (err, room) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!room) return res.status(404).json({ message: 'Room not found or you do not own it' });

    // Check current occupancy against new capacity
    db.get('SELECT COUNT(*) as count FROM users WHERE room_id = ?', [roomId], (err, row) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      const newCapacity = capacity !== undefined ? capacity : room.capacity;
      if (newCapacity < row.count) {
        return res.status(400).json({
          message: `Cannot reduce capacity to ${newCapacity}. There are currently ${row.count} student(s) in this room.`
        });
      }

      const newType = room_type || room.room_type;
      const newRate = rate !== undefined ? rate : room.rate;
      const newRoomNumber = room_number || room.room_number;
      let newAmenities = room.amenities;
      if (amenities !== undefined) {
        try {
          newAmenities = JSON.stringify(JSON.parse(amenities));
        } catch {
          newAmenities = JSON.stringify(typeof amenities === 'string' ? amenities.split(',') : amenities);
        }
      }
      const newLocation = hostel_location || room.hostel_location;
      const newHostelType = hostel_type || room.hostel_type;

      // Handle images
      let currentImages = room.images ? JSON.parse(room.images) : [];
      let keptImages = [];
      if (existing_images) {
        try {
          keptImages = JSON.parse(existing_images);
        } catch {
          keptImages = typeof existing_images === 'string' ? existing_images.split(',') : existing_images;
        }
      }

      // Delete removed images from filesystem
      const removedImages = currentImages.filter(img => !keptImages.includes(img));
      removedImages.forEach(img => {
        // img is like "/uploads/rooms/file.jpg"
        const filePath = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, img.replace('/uploads', 'uploads')) : path.join(__dirname, '..', img);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      const uploadedImages = req.files ? req.files.map(f => `/uploads/rooms/${f.filename}`) : [];
      const finalImages = JSON.stringify([...keptImages, ...uploadedImages]);

      db.run(
        'UPDATE rooms SET room_number = ?, room_type = ?, capacity = ?, rate = ?, amenities = ?, hostel_location = ?, hostel_type = ?, images = ? WHERE id = ?',
        [newRoomNumber, newType, newCapacity, newRate, newAmenities, newLocation, newHostelType, finalImages, roomId],
        (err) => {
          if (err) return res.status(500).json({ message: 'Error updating room' });
          res.json({ message: 'Room updated successfully', images: JSON.parse(finalImages) });
        }
      );
    });
  });
});

// DELETE /api/rooms/:id — Delete a room (owner only)
router.delete('/:id', authenticateToken, roleGuard(['owner']), (req, res) => {
  const roomId = req.params.id;

  // Verify ownership
  db.get('SELECT * FROM rooms WHERE id = ? AND owner_id = ?', [roomId, req.user.id], (err, room) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!room) return res.status(404).json({ message: 'Room not found or you do not own it' });

    // Deallocate students from this room
    db.run('UPDATE users SET room_id = NULL, hostel_name = NULL WHERE room_id = ?', [roomId], (err) => {
      if (err) return res.status(500).json({ message: 'Error deallocating students' });

      // Delete messages associated with this room
      db.run('DELETE FROM messages WHERE hostel_id = ?', [roomId], (err) => {
        if (err) console.error("Error clearing room messages:", err);

        // Delete images
        if (room.images) {
          const images = JSON.parse(room.images);
          images.forEach(img => {
            const filePath = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, img.replace('/uploads', 'uploads')) : path.join(__dirname, '..', img);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
        }

        // Delete the room
        db.run('DELETE FROM rooms WHERE id = ?', [roomId], (err) => {
          if (err) return res.status(500).json({ message: 'Error deleting room' });
          res.json({ message: 'Room deleted and students deallocated' });
        });
      });
    });
  });
});

module.exports = router;
