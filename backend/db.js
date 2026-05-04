const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'database.sqlite') : path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    db.run('PRAGMA foreign_keys = ON');

    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      last_profile_edit DATETIME,
      address TEXT,
      university TEXT,
      emergency_contact TEXT,
      emergency_name TEXT,
      cnic TEXT,
      hostel_name TEXT,
      room_id INTEGER REFERENCES rooms(id),
      is_verified INTEGER DEFAULT 0,
      verification_code TEXT,
      verification_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating users table', err.message);
      } else {
        // Try to add new columns in case table already existed
        const newCols = ['address', 'university', 'emergency_contact', 'emergency_name', 'cnic', 'hostel_name'];
        newCols.forEach(col => {
          db.run(`ALTER TABLE users ADD COLUMN ${col} TEXT`, () => { /* Ignore errors if columns exist */ });
        });
        db.run(`ALTER TABLE users ADD COLUMN room_id INTEGER`, () => { /* Ignore */ });
        
        // Email Verification Migration
        db.run(`ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0`, () => {
          db.run(`UPDATE users SET is_verified = 1`);
        });
        db.run(`ALTER TABLE users ADD COLUMN verification_code TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN verification_expires DATETIME`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN reset_code TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN reset_expires DATETIME`, () => {});
      }
    });

    // Create rooms table
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hostel_name TEXT NOT NULL,
      room_number TEXT NOT NULL,
      room_type TEXT NOT NULL DEFAULT 'Single',
      capacity INTEGER NOT NULL DEFAULT 1,
      rate REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      owner_id INTEGER REFERENCES users(id),
      assigned_student_id INTEGER REFERENCES users(id),
      amenities TEXT,
      hostel_location TEXT,
      hostel_type TEXT,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating rooms table', err.message);
      else {
        db.run(`ALTER TABLE rooms ADD COLUMN amenities TEXT`, () => { /* Ignore */ });
        db.run(`ALTER TABLE rooms ADD COLUMN hostel_location TEXT`, () => { /* Ignore */ });
        db.run(`ALTER TABLE rooms ADD COLUMN hostel_type TEXT`, () => { /* Ignore */ });
        db.run(`ALTER TABLE rooms ADD COLUMN images TEXT`, () => { /* Ignore */ });
      }
    });

    // Create payments table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      month TEXT,
      payment_method TEXT,
      status TEXT DEFAULT 'pending',
      receipt_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating payments table', err.message);
    });

    // Create messages table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      hostel_id INTEGER,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating messages table', err.message);
      else {
        db.run(`ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0`, () => { /* Ignore */ });
        db.run(`ALTER TABLE messages ADD COLUMN hostel_id INTEGER`, () => { /* Ignore */ });
      }
    });

    // Create profile_history table
    db.run(`CREATE TABLE IF NOT EXISTS profile_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      email TEXT,
      phone TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating messages table', err.message);
    });

    // Create complaints table (FR-07)
    db.run(`CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      hostel_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating complaints table', err.message);
    });

    // Create notices table
    db.run(`CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      hostel_name TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating notices table', err.message);
    });

    // Create notice_reads table
    db.run(`CREATE TABLE IF NOT EXISTS notice_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notice_id INTEGER NOT NULL REFERENCES notices(id),
      student_id INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(notice_id, student_id)
    )`, (err) => {
      if (err) console.error('Error creating notice_reads table', err.message);
    });

    // Create reviews table (FR-08)
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      hostel_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      review_text TEXT,
      cleanliness INTEGER,
      food INTEGER,
      staff INTEGER,
      facilities INTEGER,
      security INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating reviews table', err.message);
      else {
        // Add columns for existing databases
        db.run(`ALTER TABLE reviews ADD COLUMN cleanliness INTEGER`, () => {});
        db.run(`ALTER TABLE reviews ADD COLUMN food INTEGER`, () => {});
        db.run(`ALTER TABLE reviews ADD COLUMN staff INTEGER`, () => {});
        db.run(`ALTER TABLE reviews ADD COLUMN facilities INTEGER`, () => {});
        db.run(`ALTER TABLE reviews ADD COLUMN security INTEGER`, () => {});
      }
    });
  }
});

module.exports = db;
