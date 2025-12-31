const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const attendanceController = require('../controllers/attendance.controller');

router.use(authenticateToken);

router.get('/', attendanceController.getClassAttendance);
router.post('/', attendanceController.recordAttendance);

module.exports = router;
