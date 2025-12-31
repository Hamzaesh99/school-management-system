const jwt = require('jsonwebtoken');

// التحقق من صحة Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'الوصول مرفوض. يجب تسجيل الدخول أولاً'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'رمز الجلسة غير صالح أو منتهي الصلاحية'
            });
        }

        req.user = user;
        next();
    });
};

// التحقق من صلاحية الإداري
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'الوصول مرفوض. هذه الصفحة للإداريين فقط'
        });
    }
    next();
};

// التحقق من صلاحية المعلم
const authorizeTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'الوصول مرفوض. هذه الصفحة للمعلمين فقط'
        });
    }
    next();
};

// التحقق من صلاحية الطالب
const authorizeStudent = (req, res, next) => {
    if (req.user.role !== 'student' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'الوصول مرفوض. هذه الصفحة للطلاب فقط'
        });
    }
    next();
};

// التحقق من صلاحية ولي الأمر
const authorizeParent = (req, res, next) => {
    if (req.user.role !== 'parent' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'الوصول مرفوض. هذه الصفحة لأولياء الأمور فقط'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeTeacher,
    authorizeStudent,
    authorizeParent
};
