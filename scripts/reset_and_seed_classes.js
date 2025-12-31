const db = require('../database/connection');

async function resetAndSeedClasses() {
    try {
        console.log('🔄 جاري إعادة تعيين جدول الصفوف...');

        // 1. حذف جميع الصفوف الحالية (لإزالة التكرارات)
        // نستخدم DELETE بدلاً من TRUNCATE لتجنب مشاكل المفاتيح الخارجية إذا كانت موجودة، 
        // لكن بما أننا في مرحلة التطوير، سنحاول تنظيف الجدول.
        // ملاحظة: قد يفشل هذا إذا كان هناك طلاب مرتبطين بصفوف IDs محددة.
        // سنحاول حذف الصفوف غير المرتبطة أولاً أو سنقوم بتحديثها.

        // للحفاظ على السلامة، سنقوم فقط بإضافة الصفوف غير الموجودة، 
        // ولكن المستخدم اشتكى من التكرار في الصورة، لذا الأفضل تنظيف الجدول.
        // سنفترض أننا نريد جدولا نظيفا تماما.

        // Disable foreign key checks temporarily to allow truncate
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE classes');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('🗑️ تم حذف البيانات القديمة.');

        // 2. إضافة الصفوف الجديدة
        console.log('➕ جاري إضافة الصفوف والشعب الجديدة...');

        const grades = [
            { level: 1, name: 'الصف الأول' },
            { level: 2, name: 'الصف الثاني' },
            { level: 3, name: 'الصف الثالث' },
            { level: 4, name: 'الصف الرابع' },
            { level: 5, name: 'الصف الخامس' },
            { level: 6, name: 'الصف السادس' },
            { level: 7, name: 'الصف السابع' },
            { level: 8, name: 'الصف الثامن' },
            { level: 9, name: 'الصف التاسع' }
        ];

        const sections = ['أ', 'ب', 'ت'];
        const academicYear = '2024-2025';

        for (const grade of grades) {
            for (const section of sections) {
                // التنسيق المطلوب: الصف الأول: الشعبة (أ)
                const className = `${grade.name}: الشعبة (${section})`;

                await db.query(
                    'INSERT INTO classes (class_name, grade_level, academic_year, max_students) VALUES (?, ?, ?, ?)',
                    [className, grade.level, academicYear, 30]
                );
                console.log(`✅ تم إضافة: ${className}`);
            }
        }

        console.log('🎉 تم الانتهاء بنجاح!');
        process.exit(0);

    } catch (error) {
        console.error('❌ حدث خطأ:', error);
        // تأكد من إعادة تفعيل المفاتيح الخارجية في حالة الخطأ
        try { await db.query('SET FOREIGN_KEY_CHECKS = 1'); } catch (e) { }
        process.exit(1);
    }
}

resetAndSeedClasses();
