const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const gradeController = require('../controllers/grade.controller');

router.use(authenticateToken);

router.get('/', gradeController.getClassGrades);
router.post('/', gradeController.addGrade);

module.exports = router;
