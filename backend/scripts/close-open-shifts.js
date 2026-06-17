#!/usr/bin/env node
/** Close all open POS shifts (admin maintenance) */
require('dotenv').config();
const db = require('../src/config/db');
const posDb = require('../src/lib/posDb');

(async () => {
  const open = await db.query('SELECT id FROM pos_shifts WHERE clock_out IS NULL ORDER BY clock_in');
  for (const row of open.rows) {
    const closed = await posDb.forceCloseShiftById(row.id);
    console.log(closed ? `Closed ${row.id}` : `Skip ${row.id}`);
  }
  console.log(`Done. Closed ${open.rows.length} shift(s).`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
