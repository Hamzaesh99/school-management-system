const db = require('../database/connection');

// إرسال رسالة جديدة
exports.sendMessage = async (req, res) => {
    try {
        const { receiver_id, subject, message_text } = req.body;
        const sender_id = req.user.user_id;

        if (!receiver_id || !message_text) {
            return res.status(400).json({ success: false, message: 'مستلم الرسالة ونص الرسالة مطلوبان' });
        }

        const [result] = await db.query(
            `INSERT INTO messages (sender_id, receiver_id, subject, message_text)
             VALUES (?, ?, ?, ?)`,
            [sender_id, receiver_id, subject || 'بدون عنوان', message_text]
        );

        res.json({ success: true, message: 'تم إرسال الرسالة بنجاح', message_id: result.insertId });
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// جلب المستخدمين للمراسلة
exports.getRecipients = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT user_id, full_name, role FROM users WHERE user_id != ? AND is_active = TRUE`,
            [req.user.user_id]
        );
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في جلب المستخدمين' });
    }
};

// جلب صندوق الوارد
exports.getInbox = async (req, res) => {
    try {
        const [messages] = await db.query(
            `SELECT m.*, u.full_name as sender_name 
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             WHERE m.receiver_id = ?
             ORDER BY m.sent_at DESC`,
            [req.user.user_id]
        );
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Inbox error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في جلب الرسائل' });
    }
};

// تحديد الرسالة كمقروءة
exports.markAsRead = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.user_id;

        // التحقق من أن الرسالة تخص المستخدم الحالي
        const [result] = await db.query(
            `UPDATE messages 
             SET is_read = TRUE, read_at = NOW() 
             WHERE message_id = ? AND receiver_id = ?`,
            [messageId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'الرسالة غير موجودة أو لا تملك صلاحية الوصول إليها' });
        }

        res.json({ success: true, message: 'تم تحديث حالة الرسالة' });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};
