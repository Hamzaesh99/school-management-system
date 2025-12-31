const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth.middleware');
const studentController = require('../controllers/student.controller');

// مزامنة البيانات المفقودة (للإصلاح)
router.post('/sync-missing', authenticateToken, authorizeAdmin, studentController.syncStudents);

// جلب جميع الطلاب
router.get('/', authenticateToken, studentController.getAllStudents);

// جلب طالب محدد
router.get('/:id', authenticateToken, studentController.getStudentById);

// إضافة طالب جديد
router.post('/', authenticateToken, authorizeAdmin, studentController.createStudent);

// تحديث بيانات طالب
router.put('/:id', authenticateToken, authorizeAdmin, studentController.updateStudent);

// حذف طالب
router.delete('/:id', authenticateToken, authorizeAdmin, studentController.deleteStudent);

// جلب درجات الطالب
router.get('/:id/grades', authenticateToken, studentController.getStudentGrades);

// جلب حضور الطالب
router.get('/:id/attendance', authenticateToken, studentController.getStudentAttendance);

module.exports = router;
