const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');
const classController = require('../controllers/class.controller');

router.use(authenticateToken);

router.get('/', classController.getAllClasses);
router.get('/subjects', classController.getClassSubjects);
router.post('/', authorizeAdmin, classController.createClass);
router.put('/:id', authorizeAdmin, classController.updateClass);

module.exports = router;
