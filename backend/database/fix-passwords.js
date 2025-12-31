const bcrypt = require('bcryptjs');
const db = require('./connection');

async function fixPasswords() {
    try {
        console.log('🔧 بدء إصلاح كلمات المرور...\n');

        // إنشاء hash صحيح لكلمة المرور admin123
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);

        console.log('✅ تم إنشاء hash جديد لكلمة المرور: admin123');
        console.log('Hash:', hash, '\n');

        // تحديث كلمات المرور لجميع المستخدمين
        const users = ['admin', 'teacher1', 'student1', 'parent1'];

        for (const username of users) {
            const [result] = await db.query(
                'UPDATE users SET password_hash = ? WHERE username = ?',
                [hash, username]
            );

            if (result.affectedRows > 0) {
                console.log(`✅ تم تحديث كلمة المرور للمستخدم: ${username}`);
            } else {
                console.log(`⚠️  المستخدم ${username} غير موجود`);
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ تم إصلاح جميع كلمات المرور بنجاح!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('الآن يمكنك تسجيل الدخول بـ:');
        console.log('👤 admin    / admin123');
        console.log('👨‍🏫 teacher1 / admin123');
        console.log('👨‍🎓 student1 / admin123');
        console.log('👨‍👩‍👦 parent1  / admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        process.exit(1);
    }
}

fixPasswords();
