const db = require('./database/connection');

async function test() {
    try {
        console.log('Testing DB connection...');
        const [rows] = await db.query('SELECT * FROM teachers');
        console.log('Teachers Table Count:', rows.length);
        console.log('Teachers Data:', JSON.stringify(rows, null, 2));

        const [users] = await db.query("SELECT * FROM users WHERE role = 'teacher'");
        console.log('Teacher Users Count:', users.length);
        console.log('Teacher Users Data:', JSON.stringify(users, null, 2));

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();
