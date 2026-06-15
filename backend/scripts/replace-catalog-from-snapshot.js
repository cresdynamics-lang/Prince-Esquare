/**
 * Replace production catalog with a snapshot file (wipe then restore).
 * Usage: node scripts/replace-catalog-from-snapshot.js --confirm REPLACE --file=path/to/snapshot.json
 */
require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const { parseArgs, readSnapshot } = require('./catalog-snapshot-utils');

const confirmed =
  process.argv.includes('--confirm') && process.argv.includes('REPLACE');
const fileArg = process.argv.find((a) => a.startsWith('--file='));
const file = fileArg ? fileArg.slice('--file='.length) : null;

if (!confirmed) {
  console.error('Use --confirm REPLACE --file=path/to/snapshot.json');
  process.exit(1);
}

const snap = readSnapshot(file);
console.log(`Replace catalog with snapshot from ${snap.exported_at}`);
console.log(`  ${snap.products?.length || 0} products, ${snap.counts?.pos_products || snap.pos_products?.length || '?'} POS rows`);

execSync('node scripts/wipe-catalog-fresh.js --confirm WIPE_ALL --skip-backup', {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
});

const restoreArgs = ['node', 'scripts/restore-catalog-snapshot.js', '--confirm', 'RESTORE_ALL'];
if (file) restoreArgs.push(`--file=${file}`);

execSync(restoreArgs.join(' '), {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
});

console.log('Catalog replace complete.');
