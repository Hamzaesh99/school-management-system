const db = require('../database/connection');

// جلب إحصائيات لوحة التحكم
exports.getStats = async (req, res) => {
    try {
        // جلب أعداد حقيقية من جداول قاعدة البيانات
        const [[{ total_students }]] = await db.query('SELECT COUNT(*) as total_students FROM students');
        const [[{ total_teachers }]] = await db.query('SELECT COUNT(*) as total_teachers FROM teachers');
        const [[{ total_classes }]] = await db.query('SELECT COUNT(*) as total_classes FROM classes WHERE is_active = TRUE');
        const [[{ total_subjects }]] = await db.query('SELECT COUNT(*) as total_subjects FROM subjects WHERE is_active = TRUE');

        res.json({
            success: true,
            data: {
                total_students,
                total_teachers,
                total_classes,
                total_subjects
            }
        });
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في جلب بيانات الإحصائيات' });
    }
};

// جلب الإعلانات الأخيرة
exports.getRecentAnnouncements = async (req, res) => {
    try {
        const [announcements] = await db.query(
            `SELECT * FROM announcements 
             WHERE is_published = TRUE 
             AND (expiry_date IS NULL OR expiry_date > NOW())
             ORDER BY publish_date DESC LIMIT 5`
        );
        res.json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في جلب الإعلانات' });
    }
};

// جلب الرسائل الجديدة
exports.getNewMessages = async (req, res) => {
    try {
        const [messages] = await db.query(
            `SELECT m.*, u.full_name as sender_name 
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             WHERE m.receiver_id = ? AND m.is_read = FALSE
             ORDER BY m.sent_at DESC LIMIT 5`,
            [req.user.user_id]
        );
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في جلب الرسائل' });
    }
};
