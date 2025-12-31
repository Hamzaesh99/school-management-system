const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const db = require('../database/connection');

// جلب الإعلانات
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userRole = req.user.role;

        const [announcements] = await db.query(
            `SELECT a.*, u.full_name as published_by_name 
             FROM announcements a
             INNER JOIN users u ON a.published_by = u.user_id
             WHERE a.is_published = TRUE 
             AND (a.target_role = 'all' OR a.target_role = ?)
             AND (a.expiry_date IS NULL OR a.expiry_date > NOW())
             ORDER BY a.publish_date DESC`,
            [userRole]
        );

        res.json({ success: true, data: announcements });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
});

// إضافة إعلان
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, content, target_role, priority, expiry_date } = req.body;

        const validExpiryDate = expiry_date && expiry_date.trim() !== '' ? expiry_date : null;

        const [result] = await db.query(
            `INSERT INTO announcements (title, content, target_role, priority, published_by, expiry_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, content, target_role || 'all', priority || 'medium', req.user.user_id, validExpiryDate]
        );

        res.json({ success: true, message: 'تم إضافة الإعلان بنجاح', announcement_id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
});

// حذف إعلان
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const announcementId = req.params.id;
        const userId = req.user.user_id;
        const userRole = req.user.role;

        // التحقق من الصلاحية: هل هو المدير أو صاحب الإعلان؟
        // أولاً نجلب الإعلان لمعرفة من نشره
        const [rows] = await db.query('SELECT published_by FROM announcements WHERE announcement_id = ?', [announcementId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الإعلان غير موجود' });
        }

        const announcement = rows[0];

        if (userRole !== 'admin' && announcement.published_by !== userId) {
            return res.status(403).json({ success: false, message: 'غير مصرح لك بحذف هذا الإعلان' });
        }

        await db.query('DELETE FROM announcements WHERE announcement_id = ?', [announcementId]);

        res.json({ success: true, message: 'تم حذف الإعلان بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;
