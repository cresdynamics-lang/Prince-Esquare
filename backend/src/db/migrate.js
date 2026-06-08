const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/db');

const PENDING_BOOTSTRAP = [
  '013_schema_hardening.sql',
  '014_pos_indexes.sql',
  '015_ecommerce_indexes.sql',
];

const ensureMigrationsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum VARCHAR(64)
    )
  `);
};

const bootstrapExistingDb = async (files) => {
  const countR = await db.query('SELECT COUNT(*)::int AS c FROM schema_migrations');
  if (countR.rows[0].c > 0) return;

  const posR = await db.query("SELECT to_regclass('public.pos_products') AS t");
  if (!posR.rows[0].t) return;

  console.log('Bootstrapping migration history for existing database...');
  for (const file of files) {
    if (!PENDING_BOOTSTRAP.includes(file)) {
      await db.query(
        'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [file, 'bootstrap']
      );
    }
  }
};

const runMigrations = async () => {
  try {
    console.log('Starting migrations...');
    await ensureMigrationsTable();

    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

    await bootstrapExistingDb(files);

    for (const file of files) {
      const applied = await db.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );
      if (applied.rows.length) {
        console.log('Skip', file);
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      console.log('Running', file);
      await db.query(sql);
      await db.query(
        'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
        [file, checksum]
      );
    }

    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
