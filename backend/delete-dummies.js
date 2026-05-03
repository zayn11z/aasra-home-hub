const db = require('./db.js');
setTimeout(() => {
  db.run('DELETE FROM rooms WHERE owner_id IS NULL', function(err) {
    console.log(err || 'Deleted ' + this.changes + ' dummy rooms');
    process.exit(0);
  });
}, 1000);
