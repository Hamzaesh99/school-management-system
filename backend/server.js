const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تقديم الملفات الثابتة (Static Files)
app.use(express.static('public'));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const classRoutes = require('./routes/class.routes');
const subjectRoutes = require('./routes/subject.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const gradeRoutes = require('./routes/grade.routes');
const announcementRoutes = require('./routes/announcement.routes');
const messageRoutes = require('./routes/message.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/parents', require('./routes/parent.routes'));
app.use('/api/settings', require('./routes/settings.routes'));

// Serve HTML Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/students', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'students.html'));
});

app.get('/teachers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teachers.html'));
});

app.get('/parents', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'parents.html'));
});

app.get('/classes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'classes.html'));
});

app.get('/schedules', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'schedules.html'));
});

app.get('/attendance', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'attendance.html'));
});

app.get('/grades', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'grades.html'));
});

app.get('/parent-view', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'parent-view.html'));
});

app.get('/users-management', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'users-management.html'));
});

app.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'messages.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'الصفحة غير موجودة'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   نظام إدارة المدرسة الإلكتروني              ║
║   School Management System                     ║
╠════════════════════════════════════════════════╣
║   🚀 الخادم يعمل على المنفذ: ${PORT}             ║
║   🌐 الرابط: http://localhost:${PORT}          ║
║   📅 التاريخ: ${new Date().toLocaleString('ar-SA')}  ║
╚════════════════════════════════════════════════╝
    `);
});

module.exports = app;
