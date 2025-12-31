const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// تسجيل الدخول
router.post('/login', authController.login);

// تسجيل مستخدم جديد (للإداري فقط)
router.post('/register', authController.register);

// تسجيل الخروج
router.post('/logout', authController.logout);

// التحقق من الـ Token
router.get('/verify', authController.verifyToken);

// تغيير كلمة المرور
router.post('/change-password', authController.changePassword);

module.exports = router;
