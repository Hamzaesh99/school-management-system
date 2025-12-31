const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// إحصائيات عامة
router.get('/stats', authenticateToken, dashboardController.getStats);

// الإعلانات الحديثة
router.get('/recent-announcements', authenticateToken, dashboardController.getRecentAnnouncements);

// الرسائل الجديدة
router.get('/new-messages', authenticateToken, dashboardController.getNewMessages);

module.exports = router;
