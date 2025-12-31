const db = require('../database/connection');

async function makeEmailOptional() {
    try {
        console.log('🔄 جاري تعديل قاعدة البيانات لجعل البريد الإلكتروني اختياري...');

        // تعديل عمود البريد الإلكتروني ليكون NULLABLE
        // ملاحظة: الحفاظ على UNIQUE قد يمنع وجود أكثر من NULL في بعض أنظمة قواعد البيانات القديمة،
        // لكن في MariaDB/MySQL الحديثة، يُسمح بتكرار NULL.

        await db.query(`ALTER TABLE users MODIFY email VARCHAR(100) NULL`);

        console.log('✅ تم تعديل جدول users بنجاح.');
        process.exit(0);

    } catch (error) {
        console.error('❌ حدث خطأ:', error);
        process.exit(1);
    }
}

makeEmailOptional();
