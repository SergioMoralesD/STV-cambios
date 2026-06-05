
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'portalb2b.db');
const db = new Database(dbPath, { readonly: true });

console.log("--- USUARIOS ---");
try {
    const users = db.prepare(`
        SELECT u.id, u.usuario, u.rol_id, r.nombre as rol_nombre 
        FROM usuarios u 
        JOIN roles r ON u.rol_id = r.id
    `).all();
    console.table(users);
} catch (e) {
    console.error(e);
}
db.close();
  