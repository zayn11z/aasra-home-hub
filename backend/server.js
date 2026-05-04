const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const paymentsRoutes = require('./routes/payments');
const messagesRoutes = require('./routes/messages');
const studentsRoutes = require('./routes/students');
const complaintsRoutes = require('./routes/complaints');
const reviewsRoutes = require('./routes/reviews');
const statsRoutes = require('./routes/stats');
const noticesRoutes = require('./routes/notices');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
const UPLOADS_DIR = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'uploads') : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notices', noticesRoutes);

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Database initialization
require('./db');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep event loop alive if running under bun
setInterval(() => {}, 1000 * 60 * 60);

