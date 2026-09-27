require('dotenv').config({ path: '/var/www/Prince-Esquare/backend/.env' });
const db = require('/var/www/Prince-Esquare/backend/src/config/db');
db.query('SELECT id, name, price, category_id, is_active FROM products WHERE name ILIKE $1', ['%Moncler%'])
  .then(r => console.log(JSON.stringify(r.rows, null, 2)))
  .catch(e => console.error('Error:', e.message));
