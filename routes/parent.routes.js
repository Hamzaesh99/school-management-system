const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');
const parentController = require('../controllers/parent.controller');

router.use(authenticateToken);

router.get('/dashboard', parentController.getDashboardData);
router.get('/my-children', parentController.getMyChildrenSummary);
router.get('/performance/:studentId', parentController.getChildFullPerformance);
router.get('/', parentController.getAllParents);
router.post('/', authorizeAdmin, parentController.createParent);

module.exports = router;
