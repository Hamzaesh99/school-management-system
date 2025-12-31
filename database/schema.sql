-- ===================================
-- School Management System Database
-- ===================================

CREATE DATABASE IF NOT EXISTS school_management_db
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE school_management_db;

-- جدول المستخدمين (Users)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender ENUM('male', 'female'),
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- جدول الصفوف الدراسية (Classes/Grades)
CREATE TABLE IF NOT EXISTS classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    grade_level INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    class_teacher_id INT,
    max_students INT DEFAULT 30,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_teacher_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_grade (grade_level),
    INDEX idx_year (academic_year)
) ENGINE=InnoDB;

-- جدول المواد الدراسية (Subjects)
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    credit_hours INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (subject_code)
) ENGINE=InnoDB;

-- جدول تعيين المواد للصفوف (Class-Subject Assignment)
CREATE TABLE IF NOT EXISTS class_subjects (
    class_subject_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT,
    academic_year VARCHAR(20) NOT NULL,
    semester ENUM('first', 'second') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_class_subject (class_id, subject_id, academic_year, semester)
) ENGINE=InnoDB;

-- جدول الطلاب (Students Extended Info)
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    class_id INT,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    admission_date DATE NOT NULL,
    parent_id INT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    medical_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_class (class_id),
    INDEX idx_student_number (student_number)
) ENGINE=InnoDB;

-- جدول المعلمين (Teachers Extended Info)
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    qualification VARCHAR(100),
    specialization VARCHAR(100),
    salary DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_employee_number (employee_number)
) ENGINE=InnoDB;

-- جدول الجدول الدراسي (Timetable/Schedule)
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    class_subject_id INT NOT NULL,
    day_of_week ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(20),
    academic_year VARCHAR(20) NOT NULL,
    semester ENUM('first', 'second') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_subject_id) REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    INDEX idx_day (day_of_week),
    INDEX idx_year_semester (academic_year, semester)
) ENGINE=InnoDB;

-- جدول الحضور والغياب (Attendance)
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_subject_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    notes TEXT,
    recorded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (class_subject_id) REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_attendance (student_id, class_subject_id, attendance_date),
    INDEX idx_date (attendance_date),
    INDEX idx_student (student_id)
) ENGINE=InnoDB;

-- جدول الدرجات (Grades/Marks)
CREATE TABLE IF NOT EXISTS grades (
    grade_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_subject_id INT NOT NULL,
    exam_type ENUM('midterm', 'final', 'quiz', 'assignment', 'practical') NOT NULL,
    exam_name VARCHAR(100) NOT NULL,
    grade DECIMAL(5,2) NOT NULL,
    max_grade DECIMAL(5,2) NOT NULL,
    exam_date DATE,
    academic_year VARCHAR(20) NOT NULL,
    semester ENUM('first', 'second') NOT NULL,
    recorded_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (class_subject_id) REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_subject (class_subject_id),
    INDEX idx_year_semester (academic_year, semester)
) ENGINE=InnoDB;

-- جدول الإعلانات (Announcements)
CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    target_role ENUM('all', 'admin', 'teacher', 'student', 'parent') DEFAULT 'all',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    published_by INT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (published_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_target (target_role),
    INDEX idx_publish_date (publish_date)
) ENGINE=InnoDB;

-- جدول الرسائل (Messages/Notifications)
CREATE TABLE IF NOT EXISTS messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    subject VARCHAR(200),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_receiver (receiver_id),
    INDEX idx_sender (sender_id)
) ENGINE=InnoDB;

-- جدول أيام العطل (Holidays)
CREATE TABLE IF NOT EXISTS holidays (
    holiday_id INT AUTO_INCREMENT PRIMARY KEY,
    holiday_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB;

-- إنشاء مستخدم إداري افتراضي (admin)
-- كلمة المرور: admin123 (مشفرة باستخدام bcrypt)
INSERT IGNORE INTO users (username, email, password_hash, full_name, role, phone, gender, is_active) 
VALUES 
('admin', 'admin@school.com', '$2a$10$XxQ3rQxvzw5I4kqK5vZ5O.vP8xHKX2fJYZPY7qT6nHqQ5W5Z5Z5Zu', 'مدير النظام', 'admin', '0500000000', 'male', TRUE),
('teacher1', 'teacher1@school.com', '$2a$10$XxQ3rQxvzw5I4kqK5vZ5O.vP8xHKX2fJYZPY7qT6nHqQ5W5Z5Z5Zu', 'أحمد محمد', 'teacher', '0501111111', 'male', TRUE),
('student1', 'student1@school.com', '$2a$10$XxQ3rQxvzw5I4kqK5vZ5O.vP8xHKX2fJYZPY7qT6nHqQ5W5Z5Z5Zu', 'فاطمة علي', 'student', '0502222222', 'female', TRUE),
('parent1', 'parent1@school.com', '$2a$10$XxQ3rQxvzw5I4kqK5vZ5O.vP8xHKX2fJYZPY7qT6nHqQ5W5Z5Z5Zu', 'علي حسن', 'parent', '0503333333', 'male', TRUE);

-- إضافة بيانات تجريبية للصفوف
INSERT IGNORE INTO classes (class_name, grade_level, academic_year, max_students) 
VALUES 
('الصف الأول أ', 1, '2024-2025', 25),
('الصف الثاني ب', 2, '2024-2025', 30),
('الصف الثالث أ', 3, '2024-2025', 28);

-- إضافة مواد دراسية
INSERT IGNORE INTO subjects (subject_name, subject_code, credit_hours) 
VALUES 
('الرياضيات', 'MATH101', 4),
('اللغة العربية', 'ARAB101', 4),
('اللغة الإنجليزية', 'ENG101', 3),
('العلوم', 'SCI101', 3),
('التربية الإسلامية', 'ISL101', 2),
('التاريخ', 'HIST101', 2),
('الجغرافيا', 'GEO101', 2);
