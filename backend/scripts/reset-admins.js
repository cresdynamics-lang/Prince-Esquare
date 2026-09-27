
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const adminEmail = 'charles@prince-esquire.co.ke';
const adminName = 'Charles Mutunga';
const adminPassword = process.env.ADMIN_PASSWORD || '';

async function resetAdmins() {
  try {
    // Remove other admins (keep Charles)
    const deleted = await db.query("DELETE FROM users WHERE role = 'admin' AND email != $1", [adminEmail]);
    console.log(`Deleted ${deleted.rowCount} other admin users.`);

    // Always remove legacy Jones account if present
    const jones = await db.query("DELETE FROM users WHERE email = 'jones@gmail.com'");
    console.log(`Deleted jones users: ${jones.rowCount}`);

    const { rows: existing } = await db.query('SELECT id, password FROM users WHERE email = $1', [adminEmail]);

    if (existing.length > 0) {
      await db.query(
        "UPDATE users SET role = 'admin', name = $1, is_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE email = $2",
        [adminName, adminEmail]
      );
      if (adminPassword && adminPassword.length >= 8) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, adminEmail]);
        console.log('Updated password for admin: ' + adminEmail);
      } else {
        console.log('Promoted existing user to admin (password unchanged): ' + adminEmail);
      }
    } else {
      if (!adminPassword || adminPassword.length < 8) {
        throw new Error('ADMIN_PASSWORD env var required (min 8 chars) to create Charles admin.');
      }
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.query(
        "INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, 'admin', TRUE)",
        [adminName, adminEmail, hashedPassword]
      );
      console.log('Created admin user:', adminEmail);
    }

    console.log('Admin reset complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admins:', error);
    process.exit(1);
  }
}

resetAdmins();
