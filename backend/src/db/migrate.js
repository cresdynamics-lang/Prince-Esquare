const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const runMigrations = async () => {
    try {
        console.log('Starting migrations...');
        const schemaPath = path.join(__dirname, 'migrations', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await db.query(schema);
        console.log('Migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigrations();
