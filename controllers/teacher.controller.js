const db = require('../database/connection');
const bcrypt = require('bcryptjs');

// جلب جميع المعلمين مع المزامنة التلقائية
exports.getAllTeachers = async (req, res) => {
    try {
        // 1. مزامنة المعلمين المفقودين
        // البحث عن المستخدمين برتبة 'teacher' الذين ليس لهم سجل في جدول teachers
        const [missingTeachers] = await db.query(`
            SELECT u.user_id 
            FROM users u 
            LEFT JOIN teachers t ON u.user_id = t.user_id 
            WHERE u.role = 'teacher' AND t.teacher_id IS NULL
        `);

        if (missingTeachers.length > 0) {
            console.log(`Found ${missingTeachers.length} missing teachers. Syncing...`);
            for (const user of missingTeachers) {
                // توليد رقم وظيفي مؤقت وتاريخ تعيين افتراضي
                const employeeNumber = 'T' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
                await db.query(
                    `INSERT INTO teachers (user_id, employee_number, hire_date)
                     VALUES (?, ?, CURDATE())`,
                    [user.user_id, employeeNumber]
                );
            }
        }

        // 2. جلب القائمة مع المواد المخصصة
        const [teachers] = await db.query(
            `SELECT t.*, u.username, u.email, u.full_name, u.role, u.phone, u.gender, u.is_active,
             (SELECT GROUP_CONCAT(DISTINCT s.subject_name SEPARATOR '، ')
              FROM class_subjects cs
              JOIN subjects s ON cs.subject_id = s.subject_id
              WHERE cs.teacher_id = u.user_id) as subjects_taught
             FROM teachers t
             JOIN users u ON t.user_id = u.user_id
             ORDER BY u.full_name ASC`
        );
        res.json({ success: true, data: teachers });
    } catch (error) {
        console.error('خطأ في جلب المعلمين:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// جلب معلم محدد
exports.getTeacherById = async (req, res) => {
    try {
        const [teachers] = await db.query(
            `SELECT t.*, u.username, u.email, u.full_name, u.role, u.phone, u.gender, u.address, u.date_of_birth, u.is_active
             FROM teachers t
             JOIN users u ON t.user_id = u.user_id
             WHERE t.teacher_id = ?`,
            [req.params.id]
        );

        if (teachers.length === 0) {
            return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        }

        res.json({ success: true, data: teachers[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// إضافة معلم جديد
exports.createTeacher = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            username, email, password, full_name, phone, address,
            date_of_birth, gender, employee_number, hire_date,
            qualification, specialization, salary
        } = req.body;

        // 1. إنشاء حساب المستخدم
        const hashedPassword = await bcrypt.hash(password, 10);
        const [userResult] = await connection.query(
            `INSERT INTO users (username, email, password_hash, full_name, role, phone, address, date_of_birth, gender)
             VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?, ?)`,
            [username, email, hashedPassword, full_name, phone, address, date_of_birth, gender]
        );

        const userId = userResult.insertId;

        // 2. إنشاء سجل المعلم
        await connection.query(
            `INSERT INTO teachers (user_id, employee_number, hire_date, qualification, specialization, salary)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, employee_number, hire_date, qualification, specialization, salary]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'تم إضافة المعلم بنجاح' });
    } catch (error) {
        await connection.rollback();
        console.error('خطأ في إضافة المعلم:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أو البيانات مكررة' });
    } finally {
        connection.release();
    }
};

// تحديث بيانات معلم
exports.updateTeacher = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            full_name, email, phone, address, gender,
            qualification, specialization, salary, is_active
        } = req.body;

        // جلب user_id المرتبط بالمعلم
        const [[teacher]] = await connection.query('SELECT user_id FROM teachers WHERE teacher_id = ?', [id]);
        if (!teacher) return res.status(404).json({ success: false, message: 'المعلم غير موجود' });

        // تحديث جدول المستخدمين
        await connection.query(
            `UPDATE users SET full_name = ?, email = ?, phone = ?, address = ?, gender = ?, is_active = ?
             WHERE user_id = ?`,
            [full_name, email, phone, address, gender, is_active, teacher.user_id]
        );

        // تحديث جدول المعلمين
        await connection.query(
            `UPDATE teachers SET qualification = ?, specialization = ?, salary = ?
             WHERE teacher_id = ?`,
            [qualification, specialization, salary, id]
        );

        await connection.commit();
        res.json({ success: true, message: 'تم تحديث بيانات المعلم بنجاح' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    } finally {
        connection.release();
    }
};

// حذف معلم
exports.deleteTeacher = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        const [[teacher]] = await connection.query('SELECT user_id FROM teachers WHERE teacher_id = ?', [id]);
        if (!teacher) return res.status(404).json({ success: false, message: 'المعلم غير موجود' });

        // حذف المستخدم سيؤدي لحذف المعلم تلقائياً بسبب ON DELETE CASCADE
        await connection.query('DELETE FROM users WHERE user_id = ?', [teacher.user_id]);

        await connection.commit();
        res.json({ success: true, message: 'تم حذف المعلم بنجاح' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    } finally {
        connection.release();
    }
};

// جلب المواد والصفوف المخصصة لمعلم
exports.getTeacherAssignments = async (req, res) => {
    try {
        const { id } = req.params; // teacher_id (from teachers table)

        // نحتاج user_id أولاً لأن class_subjects يستخدم teacher_id (الذي قد يكون هو نفسه user_id، لن تحقق من Schema)
        // Schema تقول: class_subjects.teacher_id REFERENCES users(user_id)
        // لذا نحتاج تحويل teacher_id إلى user_id

        const [teacher] = await db.query('SELECT user_id FROM teachers WHERE teacher_id = ?', [id]);
        if (teacher.length === 0) return res.status(404).json({ success: false, message: 'المعلم غير موجود' });

        const userId = teacher[0].user_id;

        const [assignments] = await db.query(`
            SELECT cs.class_subject_id, c.class_name, s.subject_name, cs.academic_year, cs.semester
            FROM class_subjects cs
            JOIN classes c ON cs.class_id = c.class_id
            JOIN subjects s ON cs.subject_id = s.subject_id
            WHERE cs.teacher_id = ?
            ORDER BY cs.academic_year DESC, c.class_name
        `, [userId]);

        res.json({ success: true, data: assignments });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// تخصيص مادة وصف لمعلم
// تخصيص مادة وصف لمعلم
exports.assignSubjectToClass = async (req, res) => {
    try {
        const { teacher_id, class_id, subject_id, academic_year, semester } = req.body;
        let userId = null;

        // الحصول على user_id من teacher_id إذا تم توفيره
        if (teacher_id) {
            const [teacher] = await db.query('SELECT user_id FROM teachers WHERE teacher_id = ?', [teacher_id]);
            if (teacher.length === 0) return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
            userId = teacher[0].user_id;
        }

        // التحقق من التكرار
        const [exists] = await db.query(
            'SELECT * FROM class_subjects WHERE class_id = ? AND subject_id = ? AND academic_year = ? AND semester = ?',
            [class_id, subject_id, academic_year, semester]
        );

        if (exists.length > 0) {
            // تحديث المعلم إذا كان التخصيص موجوداً
            await db.query(
                'UPDATE class_subjects SET teacher_id = ? WHERE class_subject_id = ?',
                [userId, exists[0].class_subject_id]
            );
            // Return the existing ID to be robust
            return res.json({ success: true, message: 'تم تحديث تعيين المعلم للمادة', class_subject_id: exists[0].class_subject_id });
        }

        // إنشاء تخصيص جديد
        const [result] = await db.query(
            'INSERT INTO class_subjects (class_id, subject_id, teacher_id, academic_year, semester) VALUES (?, ?, ?, ?, ?)',
            [class_id, subject_id, userId, academic_year, semester]
        );

        res.json({ success: true, message: 'تم تخصيص المادة للمعلم بنجاح', class_subject_id: result.insertId });

    } catch (error) {
        console.error('Error assigning subject:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// إزالة تخصيص
exports.removeTeacherAssignment = async (req, res) => {
    try {
        const { id } = req.params; // class_subject_id

        // يمكننا إما حذف السجل بالكامل أو فقط إفراغ حقل المعلم
        // سأقوم بإفراغ حقل المعلم (NULL) لكي لا نفقد ارتباط المادة بالصف إذا كان هناك بيانات أخرى مرتبطة
        // لكن الجدول يقول REFERENCES users(user_id) ON DELETE SET NULL

        await db.query('UPDATE class_subjects SET teacher_id = NULL WHERE class_subject_id = ?', [id]);

        res.json({ success: true, message: 'تم إزالة التخصيص بنجاح' });
    } catch (error) {
        console.error('Error removing assignment:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};
