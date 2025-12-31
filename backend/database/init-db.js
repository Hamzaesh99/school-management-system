const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔧 بدء تهيئة قاعدة البيانات...\n');

// إنشاء اتصال بدون تحديد قاعدة بيانات
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
});

// قراءة ملف schema.sql
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

connection.connect((err) => {
    if (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
        process.exit(1);
    }

    console.log(`✅ تم الاتصال بـ MariaDB على المنفذ ${process.env.DB_PORT || 3306}`);

    // تنفيذ schema.sql
    connection.query(schema, (err, results) => {
        if (err) {
            console.error('❌ خطأ في تنفيذ schema.sql:', err.message);
            connection.end();
            process.exit(1);
        }

        console.log('\n✅ تم تنفيذ schema.sql بنجاح!');
        console.log('✅ تم إنشاء قاعدة البيانات والجداول');
        console.log('✅ تم إضافة البيانات الافتراضية\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 بيانات تسجيل الدخول الافتراضية:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 المدير       : admin    / admin123');
        console.log('👨‍🏫 المعلم      : teacher1 / admin123');
        console.log('👨‍🎓 الطالب      : student1 / admin123');
        console.log('👨‍👩‍👦 ولي الأمر   : parent1  / admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        connection.end();
        console.log('🎉 تمت التهيئة بنجاح! يمكنك الآن تشغيل السيرفر بـ: npm run dev\n');
    });
});
