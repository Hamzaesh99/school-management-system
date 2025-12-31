const db = require('../database/connection');
const bcrypt = require('bcryptjs');

// جلب جميع المستخدمين
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT user_id, username, email, full_name, role, phone, address, 
                    date_of_birth, gender, profile_image, is_active, created_at, updated_at 
             FROM users 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب مستخدم واحد
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.query(
            `SELECT user_id, username, email, full_name, role, phone, address, 
                    date_of_birth, gender, profile_image, is_active, created_at, updated_at 
             FROM users WHERE user_id = ?`,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('خطأ في جلب المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// إضافة مستخدم جديد (للمدير فقط)
exports.createUser = async (req, res) => {
    const connection = await db.getConnection(); // Use transaction for data integrity
    try {
        await connection.beginTransaction();

        const {
            username, email, password, full_name, role,
            phone, address, date_of_birth, gender,
            class_id, parent_id
        } = req.body;

        // التحقق من البيانات المطلوبة
        if (!username || !password || !full_name || !role) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال البيانات الأساسية: اسم المستخدم، كلمة المرور، الاسم الكامل، والدور'
            });
        }

        // تاريخ الميلاد إلزامي للطالب فقط
        if (role === 'student' && !date_of_birth) {
            return res.status(400).json({
                success: false,
                message: 'تاريخ الميلاد إلزامي للطلاب'
            });
        }

        const validRoles = ['admin', 'teacher', 'student', 'parent'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'الدور المحدد غير صحيح'
            });
        }

        // التحقق من وجود المستخدم
        let existingUserQuery = 'SELECT user_id FROM users WHERE username = ?';
        let queryParams = [username];

        if (email) {
            existingUserQuery += ' OR email = ?';
            queryParams.push(email);
        }

        const [existingUsers] = await connection.query(existingUserQuery, queryParams);

        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // إضافة المستخدم
        const [result] = await connection.query(
            `INSERT INTO users (username, email, password_hash, full_name, role, phone, address, date_of_birth, gender, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [username, email || null, hashedPassword, full_name, role, phone || null, address || null, date_of_birth || null, gender || null]
        );

        const userId = result.insertId;

        // إضافة سجل في الجداول الفرعية حسب الدور
        if (role === 'student') {
            // توليد رقم طالب تلقائي إذا لم يوجد
            const studentNumber = 'S' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
            await connection.query(
                `INSERT INTO students (user_id, student_number, admission_date, class_id, parent_id)
                 VALUES (?, ?, CURDATE(), ?, ?)`,
                [userId, studentNumber, class_id || null, parent_id || null]
            );
        } else if (role === 'teacher') {
            // توليد رقم موظف تلقائي
            const employeeNumber = 'T' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
            await connection.query(
                `INSERT INTO teachers (user_id, employee_number, hire_date)
                 VALUES (?, ?, CURDATE())`,
                [userId, employeeNumber]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'تم إضافة المستخدم بنجاح',
            data: {
                user_id: userId,
                username,
                email,
                full_name,
                role
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('خطأ في إضافة المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    } finally {
        connection.release();
    }
};

// تحديث بيانات مستخدم
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            username, email, full_name, role, phone,
            address, date_of_birth, gender, is_active
        } = req.body;

        // التحقق من وجود المستخدم
        const [users] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // التحقق من تكرار اسم المستخدم أو البريد
        if (username || email) {
            const [existingUsers] = await db.query(
                'SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id != ?',
                [username || '', email || '', id]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل'
                });
            }
        }

        // بناء استعلام التحديث
        const updates = [];
        const values = [];

        if (username) { updates.push('username = ?'); values.push(username); }
        if (email) { updates.push('email = ?'); values.push(email); }
        if (full_name) { updates.push('full_name = ?'); values.push(full_name); }
        if (role) { updates.push('role = ?'); values.push(role); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
        if (address !== undefined) { updates.push('address = ?'); values.push(address); }
        if (date_of_birth) { updates.push('date_of_birth = ?'); values.push(date_of_birth); }
        if (gender) { updates.push('gender = ?'); values.push(gender); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'لا توجد بيانات للتحديث'
            });
        }

        values.push(id);

        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'تم تحديث بيانات المستخدم بنجاح'
        });

    } catch (error) {
        console.error('خطأ في تحديث المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تغيير كلمة مرور مستخدم
exports.changeUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
            });
        }

        // التحقق من وجود المستخدم
        const [users] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // تشفير كلمة المرور الجديدة
        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [hashedPassword, id]
        );

        res.json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح'
        });

    } catch (error) {
        console.error('خطأ في تغيير كلمة المرور:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// حذف مستخدم
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // التحقق من وجود المستخدم
        const [users] = await db.query('SELECT role FROM users WHERE user_id = ?', [id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // منع حذف المستخدم إذا كان هو نفس المستخدم المسجل دخوله
        if (req.user.user_id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكنك حذف حسابك الخاص'
            });
        }

        await db.query('DELETE FROM users WHERE user_id = ?', [id]);

        res.json({
            success: true,
            message: 'تم حذف المستخدم بنجاح'
        });

    } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// الإحصائيات حسب الدور
exports.getUserStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                role,
                COUNT(*) as count,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
            FROM users
            GROUP BY role
        `);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// ==========================================
// وظائف الملف الشخصي (Profile Functions)
// ==========================================

// جلب الملف الشخصي للمستخدم الحالي
exports.getProfile = async (req, res) => {
    try {
        // req.user يأتي من middleware المصادقة
        const userId = req.user.user_id;

        const [users] = await db.query(
            `SELECT user_id, username, email, full_name, role, phone, address, 
                    date_of_birth, gender, profile_image AS avatar_url, is_active 
             FROM users WHERE user_id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('خطأ في جلب الملف الشخصي:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تحديث الملف الشخصي
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id; // من التوكن
        const { full_name, email, phone, address } = req.body;

        // التحقق من تكرار البريد الإلكتروني إذا تم تغييره
        if (email) {
            const [existingUsers] = await db.query(
                'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
                [email, userId]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'البريد الإلكتروني مستخدم بالفعل'
                });
            }
        }

        const updates = [];
        const values = [];

        if (full_name) { updates.push('full_name = ?'); values.push(full_name); }
        if (email) { updates.push('email = ?'); values.push(email); }
        if (phone) { updates.push('phone = ?'); values.push(phone); }
        if (address) { updates.push('address = ?'); values.push(address); }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'لا توجد بيانات للتحديث'
            });
        }

        values.push(userId);

        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'تم تحديث الملف الشخصي بنجاح'
        });

    } catch (error) {
        console.error('خطأ في تحديث الملف الشخصي:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تغيير كلمة المرور للمستخدم الحالي
exports.changeOwnPassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { current_password, new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'
            });
        }

        // جلب كلمة المرور الحالية للتحقق
        const [users] = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        const validPassword = await bcrypt.compare(current_password, users[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور الحالية غير صحيحة'
            });
        }

        // تشفير كلمة المرور الجديدة وتحديثها
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashedPassword, userId]);

        res.json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح'
        });

    } catch (error) {
        console.error('خطأ في تغيير كلمة المرور:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// رفع الصورة الشخصية
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'لم يتم اختيار ملف'
            });
        }

        const userId = req.user.user_id;
        // المسار النسبي للصورة ليتم حفظه في قاعدة البيانات
        // Multer يحفظ الملف في public/uploads/avatars
        // نحتاج الرابط الذي يمكن الوصول إليه من المتصفح: /uploads/avatars/filename
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        await db.query(
            'UPDATE users SET profile_image = ? WHERE user_id = ?',
            [avatarUrl, userId]
        );

        res.json({
            success: true,
            message: 'تم تحديث الصورة الشخصية بنجاح',
            data: {
                avatar_url: avatarUrl
            }
        });

    } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في رفع الصورة'
        });
    }
};
