/**
 * Shared helpers for catalog backup / wipe / restore.
 */
const fs = require('fs');
const path = require('path');

const SNAPSHOT_DIR = path.join(__dirname, '..', 'data', 'catalog-snapshots');
const LATEST_PATH = path.join(SNAPSHOT_DIR, 'catalog-snapshot-latest.json');

const ensureSnapshotDir = () => {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
};

const timestampSlug = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const writeSnapshot = (payload, label = 'catalog-snapshot') => {
  ensureSnapshotDir();
  const stamped = path.join(SNAPSHOT_DIR, `${label}-${timestampSlug()}.json`);
  const body = JSON.stringify(payload, null, 2);
  fs.writeFileSync(stamped, body);
  fs.writeFileSync(LATEST_PATH, body);
  return { stamped, latest: LATEST_PATH };
};

const readSnapshot = (filePath) => {
  const resolved = filePath || LATEST_PATH;
  if (!fs.existsSync(resolved)) {
    throw new Error(`Snapshot not found: ${resolved}`);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
};

const parseArgs = () => {
  const dryRun = process.argv.includes('--dry-run');
  const confirmed =
    process.argv.includes('--confirm') &&
    (process.argv.includes('WIPE_ALL') || process.argv.includes('RESTORE_ALL'));
  const fileArg = process.argv.find((a) => a.startsWith('--file='));
  return {
    dryRun,
    confirmed,
    file: fileArg ? fileArg.slice('--file='.length) : null,
  };
};

module.exports = {
  SNAPSHOT_DIR,
  LATEST_PATH,
  ensureSnapshotDir,
  writeSnapshot,
  readSnapshot,
  parseArgs,
};
