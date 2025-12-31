const db = require('../database/connection');

// جلب جميع المواد
exports.getAllSubjects = async (req, res) => {
    try {
        const [subjects] = await db.query('SELECT * FROM subjects ORDER BY subject_name');
        res.json({ success: true, data: subjects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// إنشاء مادة
exports.createSubject = async (req, res) => {
    try {
        const { subject_name, subject_code, description, credit_hours } = req.body;
        await db.query(
            'INSERT INTO subjects (subject_name, subject_code, description, credit_hours) VALUES (?, ?, ?, ?)',
            [subject_name, subject_code, description, credit_hours]
        );
        res.status(201).json({ success: true, message: 'تم إضافة المادة بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// تحديث مادة
exports.updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject_name, subject_code, description, credit_hours } = req.body;
        await db.query(
            'UPDATE subjects SET subject_name = ?, subject_code = ?, description = ?, credit_hours = ? WHERE subject_id = ?',
            [subject_name, subject_code, description, credit_hours, id]
        );
        res.json({ success: true, message: 'تم تحديث المادة بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};
