// Real POS seed — imports Stock.xlsx (not hardcoded demo catalog)
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const path = require('path');
const { spawn } = require('child_process');

const script = path.join(__dirname, '../../../scripts/pos-bootstrap.js');
const child = spawn(process.execPath, [script], { stdio: 'inherit', cwd: path.join(__dirname, '../../..') });
child.on('exit', (code) => process.exit(code ?? 0));
