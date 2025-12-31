const mysql = require('mysql2');
require('dotenv').config();

// إنشاء pool للاتصال بقاعدة البيانات
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // ← هنا نحدد المنفذ
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// تحويل إلى Promise-based للاستخدام مع async/await
const promisePool = db.promise();

// اختبار الاتصال
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MariaDB:', err);
    } else {
        console.log('Connected to MariaDB successfully on port', process.env.DB_PORT);
        connection.release();
    }
});

module.exports = promisePool;
