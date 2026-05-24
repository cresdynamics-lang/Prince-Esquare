const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const runMigrations = async () => {
    try {
        console.log('Starting migrations...');
        const dir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.sql'))
            .sort();
        
        for (const file of files) {
            const sql = fs.readFileSync(path.join(dir, file), 'utf8');
            console.log('Running', file);
            await db.query(sql);
        }
        console.log('Migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigrations();
