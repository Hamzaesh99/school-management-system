const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const messageController = require('../controllers/message.controller');

// إرسال رسالة
router.post('/', authenticateToken, messageController.sendMessage);

// جلب المستقبلين المحتملين
router.get('/recipients', authenticateToken, messageController.getRecipients);

// جلب صندوق الوارد
router.get('/inbox', authenticateToken, messageController.getInbox);

// تحديد الرسالة كمقروءة
router.put('/:id/read', authenticateToken, messageController.markAsRead);

module.exports = router;
