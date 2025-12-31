const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');
const subjectController = require('../controllers/subject.controller');

router.use(authenticateToken);

router.get('/', subjectController.getAllSubjects);
router.post('/', authorizeAdmin, subjectController.createSubject);
router.put('/:id', authorizeAdmin, subjectController.updateSubject);

module.exports = router;
