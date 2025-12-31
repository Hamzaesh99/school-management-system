const db = require('../database/connection');

// تسجيل الحضور
exports.recordAttendance = async (req, res) => {
    try {
        const { student_id, class_id, subject_id, attendance_date, status, notes } = req.body;

        // جلب معرف المادة في الصف
        let [[classSubject]] = await db.query(
            'SELECT class_subject_id FROM class_subjects WHERE class_id = ? AND subject_id = ?',
            [class_id, subject_id]
        );

        // إذا لم يتم العثور على التخصيص، قم بإنشائه تلقائياً (بدون معلم مؤقتاً)
        if (!classSubject) {
            const [result] = await db.query(
                `INSERT INTO class_subjects (class_id, subject_id, teacher_id, academic_year, semester)
                 VALUES (?, ?, NULL, '2024-2025', 'first')`,
                [class_id, subject_id]
            );
            classSubject = { class_subject_id: result.insertId };
        }

        await db.query(
            `INSERT INTO attendance (student_id, class_subject_id, attendance_date, status, notes, recorded_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [student_id, classSubject.class_subject_id, attendance_date, status, notes, req.user.user_id]
        );
        res.status(201).json({ success: true, message: 'تم تسجيل الحضور بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// جلب حضور صف في تاريخ محدد (أو كل الصفوف)
exports.getClassAttendance = async (req, res) => {
    try {
        const { class_id, date } = req.query;

        let query = `SELECT a.*, u.full_name as student_name,
                    sub.subject_name, c.class_name,
                    recorder.full_name as recorded_by_name
             FROM attendance a
             JOIN students s ON a.student_id = s.student_id
             JOIN users u ON s.user_id = u.user_id
             JOIN class_subjects cs ON a.class_subject_id = cs.class_subject_id
             JOIN subjects sub ON cs.subject_id = sub.subject_id
             JOIN classes c ON cs.class_id = c.class_id
             LEFT JOIN users recorder ON a.recorded_by = recorder.user_id
             WHERE a.attendance_date = ?`;

        const params = [date];

        if (class_id) {
            query += ' AND cs.class_id = ?';
            params.push(class_id);
        }

        query += ' ORDER BY c.class_name, u.full_name';

        const [attendance] = await db.query(query, params);
        res.json({ success: true, data: attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};
