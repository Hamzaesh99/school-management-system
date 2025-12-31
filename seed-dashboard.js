const db = require('./database/connection');

async function checkData() {
    try {
        const [ann] = await db.query("SELECT COUNT(*) as count FROM announcements");
        const [msg] = await db.query("SELECT COUNT(*) as count FROM messages");
        const [users] = await db.query("SELECT user_id, username FROM users LIMIT 3");

        console.log(`Announcements: ${ann[0].count}`);
        console.log(`Messages: ${msg[0].count}`);
        console.log('Users:', users);

        if (ann[0].count === 0) {
            console.log('Inserting dummy announcement...');
            await db.query(`INSERT INTO announcements (title, content, target_role, published_by) VALUES 
                ('ترحيب جديد', 'أهلاً بكم في نظام إدارة المدرسة المحدث. نتمنى لكم عاماً دراسياً موفقاً.', 'all', ?)`, [users[0].user_id]);
        }

        if (msg[0].count === 0 && users.length > 1) {
            console.log('Inserting dummy message...');
            await db.query(`INSERT INTO messages (sender_id, receiver_id, subject, message_text) VALUES 
                (?, ?, 'استفسار', 'هل يمكنني مراجعة ملف الطالب محمد؟')`, [users[1].user_id, users[0].user_id]);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
