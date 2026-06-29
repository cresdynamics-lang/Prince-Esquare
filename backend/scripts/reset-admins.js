
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const adminEmail = 'jones@gmail.com';
const adminPassword = 'jones12345';

async function resetAdmins() {
  try {
    // Delete all existing admins
    const deleted = await db.query("DELETE FROM users WHERE role = 'admin' AND email != $1", [adminEmail]);
    console.log(`Deleted ${deleted.rowCount} other admin users.`);

    // Check if jones@gmail.com exists
    const { rows: existing } = await db.query('SELECT id, password FROM users WHERE email = $1', [adminEmail]);

    if (existing.length > 0) {
      // Update password if it doesn't match
      const user = existing[0];
      const isMatch = await bcrypt.compare(adminPassword, user.password);
      if (!isMatch) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await db.query("UPDATE users SET password = $1, role = 'admin', is_verified = TRUE WHERE email = $2", [hashedPassword, adminEmail]);
        console.log('Updated password for admin: ' + adminEmail);
      } else {
        // Ensure role is admin
        await db.query("UPDATE users SET role = 'admin', is_verified = TRUE WHERE email = $1", [adminEmail]);
        console.log('Admin already exists with correct password: ' + adminEmail);
      }
    } else {
      // Create the admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.query(
        "INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, 'admin', TRUE)",
        ['Jones', adminEmail, hashedPassword]
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
