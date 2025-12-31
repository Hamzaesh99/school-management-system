const bcrypt = require('bcryptjs');
const db = require('./connection');

async function testLogin() {
    try {
        console.log('🔍 اختبار تسجيل الدخول...\n');

        const username = 'admin';
        const password = 'admin123';

        // البحث عن المستخدم
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        console.log('📊 عدد المستخدمين الموجودين:', users.length);

        if (users.length === 0) {
            console.log('❌ لا يوجد مستخدم بهذا الاسم!');
            process.exit(1);
        }

        const user = users[0];
        console.log('\n✅ تم العثور على المستخدم:');
        console.log('   - Username:', user.username);
        console.log('   - Email:', user.email);
        console.log('   - Full Name:', user.full_name);
        console.log('   - Role:', user.role);
        console.log('   - Active:', user.is_active);
        console.log('   - Password Hash:', user.password_hash.substring(0, 30) + '...');

        // اختبار كلمة المرور
        console.log('\n🔐 اختبار كلمة المرور...');
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (isPasswordValid) {
            console.log('✅ كلمة المرور صحيحة!');
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ تسجيل الدخول يعمل بشكل صحيح!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('يمكنك الآن تسجيل الدخول بـ:');
            console.log(`   Username: ${username}`);
            console.log(`   Password: ${password}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
            console.log('❌ كلمة المرور غير صحيحة!');
            console.log('سيتم إصلاح كلمة المرور الآن...\n');

            // إصلاح كلمة المرور
            const newHash = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE users SET password_hash = ? WHERE username = ?',
                [newHash, username]
            );

            console.log('✅ تم إصلاح كلمة المرور. حاول مرة أخرى!');
        }

        // عرض جميع المستخدمين
        console.log('\n📋 قائمة جميع المستخدمين:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        users.forEach((u, index) => {
            console.log(`${index + 1}. ${u.username.padEnd(12)} | ${u.role.padEnd(10)} | ${u.full_name}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        process.exit(1);
    }
}

testLogin();
