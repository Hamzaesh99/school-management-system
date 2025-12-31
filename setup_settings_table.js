const fs = require('fs');
const db = require('./database/connection');

async function setup() {
    try {
        const sql = fs.readFileSync('./database/create_settings.sql', 'utf8');
        // Split by semicolon to handle multiple statements if client doesn't support multi-statement
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                await db.query(statement);
                console.log('Executed statement.');
            }
        }

        console.log('Settings table setup completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up table:', error);
        process.exit(1);
    }
}

setup();
