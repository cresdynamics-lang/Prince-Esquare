require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    port: Number(process.env.DB_PORT) || 5432,
  });
  try {
    await client.connect();
    const name = process.env.DB_NAME || 'prince_esquare';
    const dbs = [name];
    for (const db of dbs) {
      const res = await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [db]);
      if (res.rowCount === 0) {
        console.log('Creating database', db);
        await client.query(`CREATE DATABASE "${db}"`);
      } else {
        console.log('Database exists', db);
      }
    }
    console.log('Done');
  } catch (e) {
    console.error('FAILED:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
