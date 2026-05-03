const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();
const db = require('../db');
const { authenticateToken, roleGuard } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = 'your_super_secret_jwt_key_here_change_in_production';

// Sign Up
router.post('/signup', async (req, res) => {
  const { name, email, password, role, phone, address, university, emergencyContact, emergencyName, cnic, hostelName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format' });
  }

  if (phone && !/^(03\d{9}|\+923\d{9})$/.test(phone)) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }

  if (role === 'student' && emergencyContact && !/^(03\d{9}|\+923\d{9})$/.test(emergencyContact)) {
    return res.status(400).json({ message: 'Invalid emergency contact format' });
  }

  if (role === 'owner' && cnic && !/^(\d{13}|\d{5}-\d{7}-\d{1})$/.test(cnic)) {
    return res.status(400).json({ message: 'Invalid CNIC format' });
  }

  try {
    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const userRole = role === 'owner' ? 'owner' : 'student';

      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expires = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins

      // Insert user
      db.run('INSERT INTO users (name, email, phone, password, role, address, university, emergency_contact, emergency_name, cnic, hostel_name, is_verified, verification_code, verification_expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)', 
        [name, email, phone || null, hashedPassword, userRole, address || null, university || null, emergencyContact || null, emergencyName || null, cnic || null, hostelName || null, otp, expires],
        async function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating user' });
          }
          
          const userId = this.lastID;
          
          // Send Email
          try {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
              }
            });

            const htmlContent = `
<div style="font-family: Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h2 style="color: #111827; margin-top: 0; text-align: center; font-size: 24px;">Aasra</h2>
  <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Hi,</p>
  <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Thanks for starting your journey with us. Please use the code below to verify your email address.</p>
  <div style="text-align: center; margin: 30px 0;">
    <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #111827; letter-spacing: 8px; padding: 15px 30px; background-color: #f3f4f6; border-radius: 6px;">${otp}</span>
  </div>
  <p style="color: #6b7280; font-size: 14px; text-align: center;">This code expires in 15 minutes.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
</div>`;

            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: email,
              subject: 'Verify your Aasra Account',
              html: htmlContent
            });

            res.status(201).json({ 
              message: 'Verification required',
              userId: userId,
              email: email
            });
          } catch (emailErr) {
            console.error('Email error:', emailErr);
            return res.status(500).json({ message: 'User created but failed to send verification email. Please check your admin credentials.' });
          }
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Log In
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    try {
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (user.is_verified === 0) {
        return res.status(403).json({ message: 'Please verify your email first.', email: user.email });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Logged in successfully',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });

    } catch (error) {
      res.status(500).json({ message: 'Server error during login' });
    }
  });
});

// GET /me
router.get('/me', authenticateToken, (req, res) => {
  db.get('SELECT id, name, email, phone, role, last_profile_edit, address, university, emergency_contact, emergency_name, cnic, hostel_name FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('/me Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (!user) {
      console.error('/me User not found for id:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  });
});

// PUT /profile
router.put('/profile', authenticateToken, (req, res) => {
  const { email, phone, address, university, emergencyContact, emergencyName } = req.body;
  if (!email && !phone && address === undefined && university === undefined && emergencyContact === undefined && emergencyName === undefined) return res.status(400).json({ message: 'Nothing to update' });

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format' });
  }

  if (phone && phone !== "Not Provided" && !/^(03\d{9}|\+923\d{9})$/.test(phone)) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }

  if (emergencyContact && emergencyContact !== "Not Provided" && !/^(03\d{9}|\+923\d{9})$/.test(emergencyContact)) {
    return res.status(400).json({ message: 'Invalid emergency contact format' });
  }

  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check 14 days rule
    if (user.last_profile_edit) {
      const lastEdit = new Date(user.last_profile_edit);
      const now = new Date();
      const diffTime = Math.abs(now - lastEdit);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays < 14) {
        return res.status(429).json({ message: `Profile can only be edited once every 14 days. Try again in ${14 - diffDays} days.` });
      }
    }

    // Save history
    db.run('INSERT INTO profile_history (user_id, email, phone) VALUES (?, ?, ?)',
      [user.id, user.email, user.phone],
      (err) => {
        if (err) return res.status(500).json({ message: 'Database error saving history' });
        
        // Update user
        const newEmail = email || user.email;
        const newPhone = phone !== undefined ? phone : user.phone;
        const newAddress = address !== undefined ? address : user.address;
        const newUniversity = university !== undefined ? university : user.university;
        const newEmergencyContact = emergencyContact !== undefined ? emergencyContact : user.emergency_contact;
        const newEmergencyName = emergencyName !== undefined ? emergencyName : user.emergency_name;
        
        db.run('UPDATE users SET email = ?, phone = ?, address = ?, university = ?, emergency_contact = ?, emergency_name = ?, last_profile_edit = CURRENT_TIMESTAMP WHERE id = ?',
          [newEmail, newPhone, newAddress, newUniversity, newEmergencyContact, newEmergencyName, user.id],
          function(err) {
            if (err) return res.status(500).json({ message: 'Error updating profile. Email might be in use.' });
            res.json({ message: 'Profile updated successfully', user: { ...user, email: newEmail, phone: newPhone, address: newAddress, university: newUniversity, emergency_contact: newEmergencyContact, emergency_name: newEmergencyName, last_profile_edit: new Date().toISOString() } });
          }
        );
      }
    );
  });
});

// GET /profile-history/:userId (owner only)
router.get('/profile-history/:userId', authenticateToken, roleGuard(['owner']), (req, res) => {
  const { userId } = req.params;
  db.all('SELECT * FROM profile_history WHERE user_id = ? ORDER BY changed_at DESC LIMIT 10', [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ history: rows });
  });
});

// Verify Email
router.post('/verify-email', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.is_verified) return res.status(400).json({ message: 'User already verified' });

    if (user.verification_code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date(user.verification_expires) < new Date()) {
      return res.status(400).json({ message: 'Verification code expired' });
    }

    // Verify user
    db.run('UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?', [user.id], function(err) {
      if (err) return res.status(500).json({ message: 'Database error linking verification' });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Email verified and logged in successfully',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    });
  });
});

module.exports = router;
