const db = require('../database/connection');

async function seedClasses() {
    try {
        console.log(' البدء في إضافة الصفوف الدراسية...');

        const grades = [
            { level: 1, name: 'الصف الأول' },
            { level: 2, 'name': 'الصف الثاني' },
            { level: 3, 'name': 'الصف الثالث' },
            { level: 4, 'name': 'الصف الرابع' },
            { level: 5, 'name': 'الصف الخامس' },
            { level: 6, 'name': 'الصف السادس' },
            { level: 7, 'name': 'الصف السابع' },
            { level: 8, 'name': 'الصف الثامن' },
            { level: 9, 'name': 'الصف التاسع' }
        ];

        const sections = ['أ', 'ب', 'ت'];
        const academicYear = '2024-2025'; // يمكن تحديثها لاحقاً

        for (const grade of grades) {
            for (const section of sections) {
                const className = `${grade.name} - الشعبة ${section}`;

                // التحقق مما إذا كان الصف موجوداً
                const [existing] = await db.query(
                    'SELECT class_id FROM classes WHERE class_name = ? AND academic_year = ?',
                    [className, academicYear]
                );

                if (existing.length === 0) {
                    await db.query(
                        'INSERT INTO classes (class_name, grade_level, academic_year, max_students) VALUES (?, ?, ?, ?)',
                        [className, grade.level, academicYear, 30]
                    );
                    console.log(`تم إضافة: ${className}`);
                } else {
                    console.log(`موجود مسبقاً: ${className}`);
                }
            }
        }

        console.log('✅ تم الانتهاء من إضافة الصفوف بنجاح');
        process.exit(0);

    } catch (error) {
        console.error('❌ حدث خطأ:', error);
        process.exit(1);
    }
}

seedClasses();
