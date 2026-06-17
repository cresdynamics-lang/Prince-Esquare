#!/usr/bin/env node
/** One-off audit: dashboard staff vs open POS shifts */
require('dotenv').config();
const db = require('../src/config/db');

(async () => {
  const users = await db.query(
    `SELECT id, name, email, role FROM users WHERE role IN ('admin', 'staff') ORDER BY role, name`
  );
  const profiles = await db.query(
    `SELECT id, full_name, email, role, is_active FROM pos_profiles ORDER BY full_name`
  );
  const open = await db.query(
    `SELECT s.id, s.seller_id, s.clock_in, pr.full_name, pr.email
     FROM pos_shifts s
     LEFT JOIN pos_profiles pr ON pr.id = s.seller_id
     WHERE s.clock_out IS NULL
     ORDER BY s.clock_in`
  );
  console.log(JSON.stringify({ users: users.rows, posProfiles: profiles.rows, openShifts: open.rows }, null, 2));
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
