const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إعداد مجلد رفع الصور
const uploadDir = 'public/uploads/avatars';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// إعداد Multer لتخزينالصور
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // تسمية الملف: user-{id}-{timestamp}.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user-' + req.user.user_id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('يسمح فقط بملفات الصور (jpeg, jpg, png, gif)'));
    }
});

// ==========================================
// مسارات عامة للمستخدمين المسجلين (Profile)
// ==========================================
router.use(authenticateToken); // حماية جميع المسارات التالية بالتوكن

// الملف الشخصي
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/change-password', userController.changeOwnPassword);
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

// ==========================================
// مسارات إدارية (Admin Only)
// ==========================================
// ملاحظة: authorizeAdmin سيطبق فقط على المسارات التالية

// جلب الإحصائيات (للمدير)
router.get('/stats', authorizeAdmin, userController.getUserStats);

// إدارة المستخدمين (للمدير)
router.get('/', authorizeAdmin, userController.getAllUsers);
router.get('/:id', authorizeAdmin, userController.getUserById);
router.post('/', authorizeAdmin, userController.createUser);
router.put('/:id', authorizeAdmin, userController.updateUser);
router.put('/:id/password', authorizeAdmin, userController.changeUserPassword); // تغيير كلمة مرور مستخدم آخر
router.delete('/:id', authorizeAdmin, userController.deleteUser);

module.exports = router;

