const db = require('better-sqlite3')('portalb2b.db');
db.exec("UPDATE vistas_urls SET url = 'STVTracker' WHERE url = 'STVTracker_Escritorio'");
console.log('URLs updated successfully');
  