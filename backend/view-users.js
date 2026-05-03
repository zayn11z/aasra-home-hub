const db = require('./db');

console.log('Fetching all users from the database...\n');

db.all('SELECT id, name, email, role, created_at FROM users', [], (err, rows) => {
  if (err) {
    console.error('Error fetching users:', err.message);
    return;
  }
  
  if (rows.length === 0) {
    console.log('No users found in the database.');
  } else {
    console.table(rows);
  }
  
  db.close();
});
