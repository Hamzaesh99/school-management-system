const db = require('../database/connection');

// جلب الجداول الدراسية مع فلترة
exports.getSchedules = async (req, res) => {
    try {
        const { class_id, academic_year, semester } = req.query;

        let query = `
            SELECT s.*, 
                   cs.class_id,
                   sub.subject_name, 
                   u.full_name as teacher_name,
                   cs.teacher_id as teacher_user_id,
                   c.class_name
            FROM schedules s
            JOIN class_subjects cs ON s.class_subject_id = cs.class_subject_id
            JOIN subjects sub ON cs.subject_id = sub.subject_id
            JOIN classes c ON cs.class_id = c.class_id
            LEFT JOIN users u ON cs.teacher_id = u.user_id
            WHERE 1=1
        `;

        const params = [];

        if (class_id) {
            query += ' AND cs.class_id = ?';
            params.push(class_id);
        }

        if (academic_year) {
            query += ' AND s.academic_year = ?';
            params.push(academic_year);
        }

        if (semester) {
            query += ' AND s.semester = ?';
            params.push(semester);
        }

        query += ` ORDER BY FIELD(s.day_of_week, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'), s.start_time`;

        const [schedules] = await db.query(query, params);
        res.json({ success: true, data: schedules });
    } catch (error) {
        console.error('Schedule fetch error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// إضافة حصة للجدول
exports.createScheduleEntry = async (req, res) => {
    try {
        const { class_subject_id, day_of_week, start_time, end_time, room_number, academic_year, semester } = req.body;

        await db.query(
            `INSERT INTO schedules (class_subject_id, day_of_week, start_time, end_time, room_number, academic_year, semester)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [class_subject_id, day_of_week, start_time, end_time, room_number, academic_year, semester]
        );

        res.status(201).json({ success: true, message: 'تم إضافة الحصة بنجاح' });
    } catch (error) {
        console.error('Schedule create error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// تحديث حصة
exports.updateScheduleEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { class_subject_id, day_of_week, start_time, end_time, room_number } = req.body;

        await db.query(
            `UPDATE schedules 
             SET class_subject_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room_number = ?
             WHERE schedule_id = ?`,
            [class_subject_id, day_of_week, start_time, end_time, room_number, id]
        );

        res.json({ success: true, message: 'تم تحديث الحصة بنجاح' });
    } catch (error) {
        console.error('Schedule update error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// حذف حصة
exports.deleteScheduleEntry = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('DELETE FROM schedules WHERE schedule_id = ?', [id]);

        res.json({ success: true, message: 'تم حذف الحصة بنجاح' });
    } catch (error) {
        console.error('Schedule delete error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};
