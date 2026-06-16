const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { canUsePosTerminal } = require('../utils/permissions');

/** Resolve pos_profiles.id for shifts/sales (legacy FK). Staff share login via users table. */
const resolvePosActorId = async (user) => {
  if (!user) return null;
  if (user.accountType === 'pos') return user.id;

  if (user.accountType === 'user' && ['admin', 'staff'].includes(user.role)) {
    const found = await db.query('SELECT id FROM pos_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1', [
      user.email,
    ]);
    if (found.rows.length) return found.rows[0].id;
    if (!canUsePosTerminal(user)) return null;
    return ensurePosProfileForStaffUser(user);
  }
  return null;
};

const ensurePosProfileForStaffUser = async (user, plainPassword = null) => {
  const existing = await db.query('SELECT id FROM pos_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1', [
    user.email,
  ]);
  if (existing.rows.length) return existing.rows[0].id;

  const hash = plainPassword
    ? await bcrypt.hash(plainPassword, 10)
    : await bcrypt.hash(`staff-pos-${user.id}`, 10);

  const ins = await db.query(
    `INSERT INTO pos_profiles (full_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'SELLER', true)
     RETURNING id`,
    [user.name || user.fullName || 'Staff', user.email, hash]
  );
  return ins.rows[0].id;
};

module.exports = {
  resolvePosActorId,
  ensurePosProfileForStaffUser,
};
