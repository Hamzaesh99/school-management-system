const db = require('../database/connection');
const bcrypt = require('bcryptjs');

// جلب جميع أولياء الأمور
exports.getAllParents = async (req, res) => {
    try {
        const [parents] = await db.query(
            `SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.address, u.gender, u.is_active, u.created_at,
                    COUNT(s.student_id) as children_count,
                    GROUP_CONCAT(su.full_name SEPARATOR ', ') as children_names
             FROM users u
             LEFT JOIN students s ON u.user_id = s.parent_id
             LEFT JOIN users su ON s.user_id = su.user_id
             WHERE u.role = 'parent'
             GROUP BY u.user_id
             ORDER BY u.full_name ASC`
        );
        res.json({ success: true, data: parents });
    } catch (error) {
        console.error('خطأ في جلب أولياء الأمور:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// جلب أبناء ولي أمر محدد (تلقائياً من المستخدم المسجل)
exports.getMyChildrenSummary = async (req, res) => {
    try {
        const parentId = req.user.user_id;
        const [children] = await db.query(
            `SELECT s.student_id, s.student_number, u.full_name, c.class_name, 
                    (SELECT AVG(grade/max_grade)*100 FROM grades WHERE student_id = s.student_id) as average_grade,
                    (SELECT COUNT(*) FROM attendance WHERE student_id = s.student_id AND status = 'present') as attendance_count,
                    (SELECT COUNT(*) FROM attendance WHERE student_id = s.student_id) as total_attendance
             FROM students s
             JOIN users u ON s.user_id = u.user_id
             LEFT JOIN classes c ON s.class_id = c.class_id
             WHERE s.parent_id = ?`,
            [parentId]
        );
        res.json({ success: true, data: children });
    } catch (error) {
        console.error('Error fetching children:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// جلب تفاصيل أداء طالب (للأب)
exports.getChildFullPerformance = async (req, res) => {
    try {
        const parentId = req.user.user_id;
        const studentId = req.params.studentId;

        // التحقق أن الطالب يخص ولي الأمر
        const [check] = await db.query('SELECT parent_id FROM students WHERE student_id = ?', [studentId]);
        if (check.length === 0 || check[0].parent_id !== parentId) {
            return res.status(403).json({ success: false, message: 'غير مصرح لك بعرض بيانات هذا الطالب' });
        }

        // الدرجات
        const [grades] = await db.query(
            `SELECT g.*, s.subject_name 
             FROM grades g 
             JOIN class_subjects cs ON g.class_subject_id = cs.class_subject_id
             JOIN subjects s ON cs.subject_id = s.subject_id
             WHERE g.student_id = ? ORDER BY g.exam_date DESC LIMIT 10`,
            [studentId]
        );

        // الحضور
        const [attendance] = await db.query(
            `SELECT * FROM attendance WHERE student_id = ? ORDER BY attendance_date DESC LIMIT 10`,
            [studentId]
        );

        res.json({
            success: true,
            data: { grades, attendance }
        });
    } catch (error) {
        console.error('Error fetching performance:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
};

// إضافة ولي أمر جديد
exports.createParent = async (req, res) => {
    try {
        const { username, email, password, full_name, phone, address, gender } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (username, email, password_hash, full_name, role, phone, address, gender)
             VALUES (?, ?, ?, ?, 'parent', ?, ?, ?)`,
            [username, email, hashedPassword, full_name, phone, address, gender]
        );

        res.status(201).json({ success: true, message: 'تم إضافة ولي الأمر بنجاح', parent_id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الإضافة أو البيانات مكررة' });
    }
};

/**
 * Unified Parent Dashboard API
 * Returns: { children: [ {info, teachers, grades, attendance} ], announcements: [] }
 */
exports.getDashboardData = async (req, res) => {
    try {
        const parentId = req.user.user_id;

        // 1. Get all children linked to this parent
        const [children] = await db.query(`
            SELECT s.student_id, s.student_number, u.full_name, u.profile_image, c.class_name, c.class_id
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            LEFT JOIN classes c ON s.class_id = c.class_id
            WHERE s.parent_id = ?
        `, [parentId]);

        // 2. For each child, fetch details
        const childrenData = await Promise.all(children.map(async (child) => {
            // A. Get Teachers & Subjects
            const [teachers] = await db.query(`
                SELECT s.subject_name, u.full_name as teacher_name
                FROM class_subjects cs
                JOIN subjects s ON cs.subject_id = s.subject_id
                LEFT JOIN users u ON cs.teacher_id = u.user_id
                WHERE cs.class_id = ?
            `, [child.class_id]);

            // B. Get Recent Grades (Last 5)
            const [recentGrades] = await db.query(`
                SELECT g.grade, g.max_grade, g.exam_name, g.exam_date, s.subject_name
                FROM grades g
                JOIN class_subjects cs ON g.class_subject_id = cs.class_subject_id
                JOIN subjects s ON cs.subject_id = s.subject_id
                WHERE g.student_id = ?
                ORDER BY g.created_at DESC
                LIMIT 5
            `, [child.student_id]);

            // C. Get Recent Attendance (Last 5 entries)
            const [recentAttendance] = await db.query(`
                SELECT status, attendance_date, notes
                FROM attendance
                WHERE student_id = ?
                ORDER BY attendance_date DESC
                LIMIT 5
            `, [child.student_id]);

            return {
                ...child,
                teachers,
                recentGrades,
                recentAttendance
            };
        }));

        // 3. Get Announcements
        const [announcements] = await db.query(`
            SELECT title, content, publish_date
            FROM announcements
            WHERE target_role IN ('all', 'parent')
            AND is_published = TRUE
            ORDER BY publish_date DESC
            LIMIT 5
        `);

        // 4. Return aggregated response
        res.json({
            success: true,
            data: {
                parent_info: { id: parentId },
                children: childrenData,
                announcements: announcements
            }
        });

    } catch (error) {
        console.error('Error fetching unified dashboard data:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

