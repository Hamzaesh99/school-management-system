const db = require('../database/connection');
const bcrypt = require('bcryptjs');

// جلب جميع الطلاب
exports.getAllStudents = async (req, res) => {
    try {
        const { class_id } = req.query;
        let query = `SELECT s.*, u.*, c.class_name, c.grade_level,
                    p.full_name as parent_name
             FROM students s
             INNER JOIN users u ON s.user_id = u.user_id
             LEFT JOIN classes c ON s.class_id = c.class_id
             LEFT JOIN users p ON s.parent_id = p.user_id
             WHERE u.is_active = TRUE`;

        const params = [];
        if (class_id) {
            query += ` AND s.class_id = ?`;
            params.push(class_id);
        }

        query += ` ORDER BY u.full_name`;

        const [students] = await db.query(query, params);

        res.json({
            success: true,
            data: students
        });

    } catch (error) {
        console.error('خطأ في جلب الطلاب:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب طالب محدد
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const [students] = await db.query(
            `SELECT s.*, u.*, c.class_name, c.grade_level,
                    p.full_name as parent_name, p.phone as parent_phone
             FROM students s
             INNER JOIN users u ON s.user_id = u.user_id
             LEFT JOIN classes c ON s.class_id = c.class_id
             LEFT JOIN users p ON s.parent_id = p.user_id
             WHERE s.student_id = ?`,
            [id]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطالب غير موجود'
            });
        }

        res.json({
            success: true,
            data: students[0]
        });

    } catch (error) {
        console.error('خطأ في جلب الطالب:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// إضافة طالب جديد
exports.createStudent = async (req, res) => {
    try {
        const {
            username, email, password, full_name, phone, address,
            date_of_birth, gender, student_number, admission_date,
            class_id, parent_id, emergency_contact, emergency_phone
        } = req.body;

        // التحقق من البيانات
        if (!username || !password || !full_name || !student_number) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال جميع البيانات المطلوبة'
            });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // التعامل مع البريد الإلكتروني
        const emailValue = email ? email : null;

        // إضافة المستخدم
        const [userResult] = await db.query(
            `INSERT INTO users (username, email, password_hash, full_name, role, phone, address, date_of_birth, gender)
             VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?)`,
            [username, emailValue, hashedPassword, full_name, phone, address, date_of_birth, gender]
        );

        const userId = userResult.insertId;

        // إضافة بيانات الطالب
        const [studentResult] = await db.query(
            `INSERT INTO students (user_id, student_number, admission_date, class_id, parent_id, emergency_contact, emergency_phone)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, student_number, admission_date, class_id, parent_id, emergency_contact, emergency_phone]
        );

        res.status(201).json({
            success: true,
            message: 'تم إضافة الطالب بنجاح',
            student_id: studentResult.insertId
        });

    } catch (error) {
        console.error('خطأ في إضافة الطالب:', error);
        res.status(500).json({
            success: false,
            message: error.code === 'ER_DUP_ENTRY' ? 'اسم المستخدم أو البريد الإلكتروني أو رقم الطالب موجود بالفعل' : 'حدث خطأ في الخادم'
        });
    }
};

// تحديث بيانات طالب
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            full_name, phone, address, date_of_birth, gender,
            class_id, emergency_contact, emergency_phone, email
        } = req.body;

        // الحصول على user_id
        const [student] = await db.query('SELECT user_id FROM students WHERE student_id = ?', [id]);

        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطالب غير موجود'
            });
        }

        const userId = student[0].user_id;

        // التعامل مع البريد الإلكتروني
        const emailValue = email ? email : null;

        // تنسيق التاريخ إذا كان موجوداً
        const formattedDob = date_of_birth ? new Date(date_of_birth).toISOString().split('T')[0] : null;

        // تحديث بيانات المستخدم
        await db.query(
            `UPDATE users 
             SET full_name = ?, phone = ?, address = ?, date_of_birth = ?, gender = ?, email = ?
             WHERE user_id = ?`,
            [full_name, phone, address, formattedDob, gender, emailValue, userId]
        );

        // تحديث بيانات الطالب
        await db.query(
            `UPDATE students 
             SET class_id = ?, parent_id = ?, emergency_contact = ?, emergency_phone = ?
             WHERE student_id = ?`,
            [class_id || null, req.body.parent_id || null, emergency_contact, emergency_phone, id]
        );

        res.json({
            success: true,
            message: 'تم تحديث بيانات الطالب بنجاح'
        });

    } catch (error) {
        console.error('خطأ تفصيلي في تحديث الطالب:', error);
        console.error('البيانات المرسلة:', req.body);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم: ' + error.message
        });
    }
};

// حذف طالب
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        // الحصول على user_id
        const [student] = await db.query('SELECT user_id FROM students WHERE student_id = ?', [id]);

        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطالب غير موجود'
            });
        }

        // حذف المستخدم (سيحذف الطالب تلقائياً بسبب CASCADE)
        await db.query('DELETE FROM users WHERE user_id = ?', [student[0].user_id]);

        res.json({
            success: true,
            message: 'تم حذف الطالب بنجاح'
        });

    } catch (error) {
        console.error('خطأ في حذف الطالب:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب درجات الطالب
exports.getStudentGrades = async (req, res) => {
    try {
        const { id } = req.params;

        const [grades] = await db.query(
            `SELECT g.*, s.subject_name, cs.semester, cs.academic_year
             FROM grades g
             INNER JOIN class_subjects cs ON g.class_subject_id = cs.class_subject_id
             INNER JOIN subjects s ON cs.subject_id = s.subject_id
             WHERE g.student_id = ?
             ORDER BY g.exam_date DESC`,
            [id]
        );

        res.json({
            success: true,
            data: grades
        });

    } catch (error) {
        console.error('خطأ في جلب الدرجات:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب حضور الطالب
exports.getStudentAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        const [attendance] = await db.query(
            `SELECT a.*, s.subject_name, cs.semester, cs.academic_year
             FROM attendance a
             INNER JOIN class_subjects cs ON a.class_subject_id = cs.class_subject_id
             INNER JOIN subjects s ON cs.subject_id = s.subject_id
             WHERE a.student_id = ?
             ORDER BY a.attendance_date DESC
             LIMIT 50`,
            [id]
        );

        res.json({
            success: true,
            data: attendance
        });

    } catch (error) {
        console.error('خطأ في جلب الحضور:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// مزامنة الطلاب (إصلاح البيانات المفقودة)
exports.syncStudents = async (req, res) => {
    try {
        // العثور على المستخدمين برتبة طالب والذين ليس لديهم سجل في جدول الطلاب
        const [missingStudents] = await db.query(`
            SELECT u.user_id 
            FROM users u 
            LEFT JOIN students s ON u.user_id = s.user_id 
            WHERE u.role = 'student' AND s.student_id IS NULL
        `);

        let addedCount = 0;
        for (const user of missingStudents) {
            const studentNumber = 'S' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
            await db.query(
                `INSERT INTO students (user_id, student_number, admission_date)
                 VALUES (?, ?, CURDATE())`,
                [user.user_id, studentNumber]
            );
            addedCount++;
        }

        res.json({
            success: true,
            message: `تم مزامنة ${addedCount} طالب بنجاح`
        });

    } catch (error) {
        console.error('خطأ في مزامنة الطلاب:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في عملية المزامنة'
        });
    }
};
