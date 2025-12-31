const db = require('./database/connection');

async function linkUsers() {
    try {
        console.log('Linking users to teachers and students tables...');

        // Get some users
        const [teachers] = await db.query("SELECT user_id FROM users WHERE role = 'teacher'");
        const [students] = await db.query("SELECT user_id FROM users WHERE role = 'student'");

        for (let i = 0; i < teachers.length; i++) {
            await db.query("INSERT IGNORE INTO teachers (user_id, employee_number, hire_date) VALUES (?, ?, ?)",
                [teachers[i].user_id, `TCH-${100 + i}`, new Date()]);
        }

        for (let i = 0; i < students.length; i++) {
            await db.query("INSERT IGNORE INTO students (user_id, student_number, admission_date) VALUES (?, ?, ?)",
                [students[i].user_id, `STU-${1000 + i}`, new Date()]);
        }

        console.log('Success: Users linked.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

linkUsers();
