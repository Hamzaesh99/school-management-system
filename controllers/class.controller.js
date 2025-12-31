const db = require('../database/connection');

// جلب جميع الصفوف مع اسم المعلم المسؤول
exports.getAllClasses = async (req, res) => {
    try {
        const [classes] = await db.query(
            `SELECT c.*, 
             u.full_name as class_teacher_name,
             (SELECT GROUP_CONCAT(DISTINCT u2.full_name SEPARATOR '، ')
              FROM class_subjects cs
              JOIN users u2 ON cs.teacher_id = u2.user_id
              WHERE cs.class_id = c.class_id) as teachers_list
             FROM classes c
             LEFT JOIN users u ON c.class_teacher_id = u.user_id
             ORDER BY c.grade_level, c.class_name`
        );

        // Merge both teacher sources: class_teacher and teachers from assignments
        const classesWithTeachers = classes.map(cls => ({
            ...cls,
            teacher_name: cls.teachers_list || cls.class_teacher_name || null
        }));

        res.json({ success: true, data: classesWithTeachers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// إنشاء صف جديد
exports.createClass = async (req, res) => {
    try {
        const { class_name, grade_level, academic_year, class_teacher_id, max_students, description } = req.body;
        const [result] = await db.query(
            `INSERT INTO classes (class_name, grade_level, academic_year, class_teacher_id, max_students, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [class_name, grade_level, academic_year, class_teacher_id, max_students, description]
        );
        res.status(201).json({ success: true, message: 'تم إنشاء الصف بنجاح', class_id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// تحديث صف
exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { class_name, grade_level, academic_year, class_teacher_id, max_students, description, is_active } = req.body;
        await db.query(
            `UPDATE classes SET class_name = ?, grade_level = ?, academic_year = ?, class_teacher_id = ?, 
             max_students = ?, description = ?, is_active = ?
             WHERE class_id = ?`,
            [class_name, grade_level, academic_year, class_teacher_id, max_students, description, is_active, id]
        );
        res.json({ success: true, message: 'تم تحديث الصف بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// جلب المواد المخصصة لصف معين
exports.getClassSubjects = async (req, res) => {
    try {
        const { class_id, academic_year, semester } = req.query;

        let query = `
            SELECT cs.*, s.subject_name, s.subject_code, u.full_name as teacher_name
            FROM class_subjects cs
            JOIN subjects s ON cs.subject_id = s.subject_id
            LEFT JOIN users u ON cs.teacher_id = u.user_id
            WHERE 1=1
        `;

        const params = [];

        if (class_id) {
            query += ' AND cs.class_id = ?';
            params.push(class_id);
        }

        if (academic_year) {
            query += ' AND cs.academic_year = ?';
            params.push(academic_year);
        }

        if (semester) {
            query += ' AND cs.semester = ?';
            params.push(semester);
        }

        query += ' ORDER BY s.subject_name';

        const [subjects] = await db.query(query, params);
        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Class subjects fetch error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};
