const db = require('./database/connection');

async function checkAnnouncements() {
    try {
        const [rows] = await db.query('SELECT * FROM announcements ORDER BY publish_date DESC');
        console.log('Announcements in DB:', JSON.stringify(rows, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkAnnouncements();
