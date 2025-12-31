# نظام إدارة المدرسة الإلكتروني
## School Management System

نظام شامل لإدارة المدارس يتضمن إدارة الطلاب والمعلمين والصفوف والجداول الدراسية والحضور والدرجات.

## 📋 المميزات

- ✅ **نظام مصادقة آمن** - JWT Authentication
- 👥 **إدارة متعددة الأدوار** - Admin, Teacher, Student, Parent
- 👨‍🎓 **إدارة الطلاب** - CRUD Operations
- 👨‍🏫 **إدارة المعلمين**
- 🏫 **إدارة الصفوف والمواد**
- 📅 **الجداول الدراسية**
- ✅ **الحضور والغياب**
- 📝 **إدارة الدرجات**
- 📢 **الإعلانات والرسائل**
- 📊 **لوحة تحكم تفاعلية**

## 🛠️ التقنيات المستخدمة

### Backend
- Node.js
- Express.js
- MariaDB / MySQL
- JWT للمصادقة
- bcrypt للتشفير

### Frontend
- HTML5
- CSS3 (Custom Design System)
- JavaScript (Vanilla)
- Bootstrap Icons

## 📦 التثبيت

### 1. تثبيت التبعيات

```bash
npm install
```

### 2. إعداد قاعدة البيانات

قم بإنشاء قاعدة بيانات MariaDB/MySQL:

```sql
CREATE DATABASE school_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

ثم قم باستيراد ملف schema.sql:

```bash
mysql -u root -p school_management_db < database/schema.sql
```

### 3. تكوين متغيرات البيئة

قم بإنشاء ملف `.env` ونسخ محتوى `.env.example` وتعديل القيم:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_management_db
DB_PORT=3306
PORT=3000
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### 4. تشغيل الخادم

```bash
# Development mode
npm run dev

# Production mode
npm start
```

سيعمل الخادم على: `http://localhost:3000`

## 👤 بيانات الدخول الافتراضية

### المدير (Admin)
- **Username:** admin
- **Password:** admin123

### معلم (Teacher)
- **Username:** teacher1
- **Password:** admin123

### طالب (Student)
- **Username:** student1
- **Password:** admin123

### ولي أمر (Parent)
- **Username:** parent1
- **Password:** admin123

## 📱 الشاشات الرئيسية

1. **شاشة تسجيل الدخول** - `/login`
2. **لوحة التحكم** - `/dashboard`
3. **إدارة الطلاب** - `/students`
4. **إدارة المعلمين** - `/teachers`
5. **إدارة أولياء الأمور** - `/parents`
6. **الصفوف والمواد** - `/classes`
7. **الجداول الدراسية** - `/schedules`
8. **الحضور والغياب** - `/attendance`
9. **الدرجات** - `/grades`
10. **عرض ولي الأمر** - `/parent-view`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - تسجيل الدخول  
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/logout` - تسجيل الخروج

### Dashboard
- `GET /api/dashboard/stats` - الإحصائيات
- `GET /api/dashboard/recent-announcements` - الإعلانات الأخيرة
- `GET /api/dashboard/new-messages` - الرسائل الجديدة

### Students
- `GET /api/students` - جلب جميع الطلاب
- `GET /api/students/:id` - جلب طالب محدد
- `POST /api/students` - إضافة طالب
- `PUT /api/students/:id` - تحديث طالب
- `DELETE /api/students/:id` - حذف طالب

### Teachers, Classes, Subjects, etc.
انظر التوثيق الكامل في مجلد `routes/`

## 🎨 نظام التصميم

النظام يستخدم نظام ألوان مخصص:
- **Calm Blue:** `#4A90E2` - للعناصر الأساسية
- **Purple:** `#8B5CF6` - للعناصر الثانوية
- **Calm Orange:** `#FF8A5B` - للتحذيرات والتنبيهات

## 🚀 التطوير المستقبلي

- [ ] إضافة الرسائل الفورية (Real-time Chat)
- [ ] تقارير وإحصائيات متقدمة
- [ ] نظام الدفع الإلكتروني
- [ ] تطبيق الموبايل
- [ ] تصدير البيانات (PDF, Excel)
- [ ] نظام الإشعارات Push Notifications

## 📝 الترخيص

MIT License

## 👨‍💻 المطورون

تم تطويره كمشروع تخرج - نظام إدارة مدرسة شامل

---

**ملاحظة:** هذا المشروع تعليمي ويحتاج إلى مراجعة أمنية قبل استخدامه في بيئة الإنتاج.
