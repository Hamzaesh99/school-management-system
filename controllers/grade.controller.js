const db = require('../database/connection');

// إضافة درجة لطالب
exports.addGrade = async (req, res) => {
    try {
        const { student_id, class_id, subject_id, exam_type, exam_name, grade, max_grade, exam_date, academic_year, semester, notes } = req.body;

        const [[cs]] = await db.query('SELECT class_subject_id FROM class_subjects WHERE class_id = ? AND subject_id = ?', [class_id, subject_id]);
        if (!cs) return res.status(404).json({ success: false, message: 'المادة غير موجودة في هذا الصف' });

        await db.query(
            `INSERT INTO grades (student_id, class_subject_id, exam_type, exam_name, grade, max_grade, exam_date, academic_year, semester, notes, recorded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, cs.class_subject_id, exam_type, exam_name, grade, max_grade, exam_date, academic_year, semester, notes, req.user.user_id]
        );
        res.status(201).json({ success: true, message: 'تم إضافة الدرجة بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// جلب درجات صف لمادة معينة
// جلب الدرجات مع فلترة مرنة
exports.getClassGrades = async (req, res) => {
    try {
        const { class_id, subject_id, student_id } = req.query;
        let query = `SELECT g.*, u.full_name as student_name, s.subject_name,
                            c.class_name, g.exam_type
                     FROM grades g
                     JOIN students st ON g.student_id = st.student_id
                     JOIN users u ON st.user_id = u.user_id
                     JOIN class_subjects cs ON g.class_subject_id = cs.class_subject_id
                     JOIN subjects s ON cs.subject_id = s.subject_id
                     JOIN classes c ON cs.class_id = c.class_id
                     WHERE 1=1`;

        const params = [];

        if (class_id) {
            query += ' AND cs.class_id = ?';
            params.push(class_id);
        }
        if (subject_id) {
            query += ' AND cs.subject_id = ?';
            params.push(subject_id);
        }
        if (student_id) { // For parents/students specific view
            query += ' AND g.student_id = ?';
            params.push(student_id);
        }

        query += ' ORDER BY g.exam_date DESC, c.class_name, u.full_name';

        const [grades] = await db.query(query, params);
        res.json({ success: true, data: grades });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};
