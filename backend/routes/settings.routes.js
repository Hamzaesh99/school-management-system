const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');

// Public route to get settings
router.get('/', settingsController.getAllSettings);

// Admin only route to update settings
router.post('/', authenticateToken, authorizeAdmin, settingsController.updateSettings);

module.exports = router;
