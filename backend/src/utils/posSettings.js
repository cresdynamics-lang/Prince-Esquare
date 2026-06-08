// NEW — Read POS settings from existing settings table
const db = require('../config/db');

const getPosSettings = async () => {
  const result = await db.query(
    "SELECT key, value FROM settings WHERE key LIKE 'pos_%'"
  );
  return Object.fromEntries(result.rows.map((r) => [r.key, r.value]));
};

const getPosSetting = async (key, fallback = null) => {
  const result = await db.query('SELECT value FROM settings WHERE key = $1', [key]);
  return result.rows[0]?.value ?? fallback;
};

const upsertPosSetting = async (key, value) => {
  await db.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  );
};

module.exports = { getPosSettings, getPosSetting, upsertPosSetting };
