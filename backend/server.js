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

// Middleware
app.use(cors());
app.use(express.json());

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

// Database initialization
require('./db');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep event loop alive if running under bun
setInterval(() => {}, 1000 * 60 * 60);

