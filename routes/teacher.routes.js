const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin, authorizeTeacher } = require('../middleware/auth.middleware');
const teacherController = require('../controllers/teacher.controller');

// جميع المسارات تتطلب تسجيل الدخول
router.use(authenticateToken);

// جلب جميع المعلمين
router.get('/', teacherController.getAllTeachers);

// جلب معلم محدد
router.get('/:id', teacherController.getTeacherById);

// العمليات التالية تتطلب صلاحية مدير
router.post('/', authorizeAdmin, teacherController.createTeacher);
router.put('/:id', authorizeAdmin, teacherController.updateTeacher);
router.delete('/:id', authorizeAdmin, teacherController.deleteTeacher);

// إدارة تخصيص المواد والصفوف
router.get('/:id/assignments', teacherController.getTeacherAssignments);
router.post('/assignments', authorizeTeacher, teacherController.assignSubjectToClass);
router.delete('/assignments/:id', authorizeAdmin, teacherController.removeTeacherAssignment);

module.exports = router;
