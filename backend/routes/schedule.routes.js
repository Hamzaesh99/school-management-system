const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin, authorizeTeacher } = require('../middleware/auth.middleware');
const scheduleController = require('../controllers/schedule.controller');

router.use(authenticateToken);

router.get('/', scheduleController.getSchedules);
router.post('/', authorizeTeacher, scheduleController.createScheduleEntry);
router.put('/:id', authorizeTeacher, scheduleController.updateScheduleEntry);
router.delete('/:id', authorizeTeacher, scheduleController.deleteScheduleEntry);

module.exports = router;
