
const Database = require('better-sqlite3');
const db = new Database('portalb2b.db');
const hash = '$argon2id$v=19$m=65536,t=3,p=1$Mc0Kur99vyODix8A0VoSHA$ZXbzwb0GOVEeipqzTqq8PAg1HmBgrxMk2I9UcDSQK0w';
const result = db.prepare('UPDATE usuarios SET pass_hash = ? WHERE usuario IN (?, ?, ?)').run(hash, 'neftali', 'lukas', 'admin');
console.log('Updated rows:', result.changes);
const admin = db.prepare('SELECT id, usuario, pass_hash FROM usuarios WHERE usuario = ?').get('admin');
console.log('Admin user:', admin);
db.close();
  