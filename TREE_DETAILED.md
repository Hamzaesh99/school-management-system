# TREE_DETAILED.md

ملف مرجعي يوضح شجرة المشروع الكاملة مع وصف وظيفي لكل مجلد وملف داخل مشروع "System school tauswol".

---

## ملخص
هذا الملف يجمع شجرة المشروع الحالية ويشرح وظيفة كل ملف ومجلد — مفيد كمراجع للمطوّر والمدير التقني.

---

## شجرة المشروع (مفصّلة)

```
System school tauswol/
│
├── .env
├── .env.example                       # نموذج متغيرات البيئة
├── .gitignore                         # قائمة الملفات المستبعدة من Git
├── NETLIFY_DEPLOYMENT_GUIDE.md        # دليل نشر الواجهة على Netlify
├── NETLIFY_DEPLOYMENT_GUIDE.md
├── README.md                          # توثيق عام للمشروع
├── PROJECT_SUMMARY.md                 # ملخص المشروع (هذا المشروع)
├── USER_GUIDE.md                      # دليل المستخدم
├── USER_MANAGEMENT_GUIDE.md           # دليل إدارة المستخدم
├── package.json                       # تعريف الحزم وأوامر التشغيل
├── package-lock.json                  # قفل نسخ التبعيات (إن وُجد)
├── server.js                          # الخادم الرئيسي (entry point)
├── start.bat                          # سكربت تشغيل على Windows
├── test-db.js                         # سكربت لاختبار الاتصال بقاعدة البيانات
├── seed-dashboard.js                  # سكربت لتهيئة/تعبئة بيانات للوحة
├── .netlify/                          # مجلد إعدادات Netlify محلي (إن وُجد)
│
├── backend/                           # (نسخة/تنظيم الخادم والموديلات الخاصة بالخادم)
│   ├── package-lock.json
│   ├── server.js                      # خادم Node/Express (قد يُستخدم للنشر على منصات منفصلة)
│   ├── database/
│   │   ├── connection.js              # إعداد اتصال لقواعد البيانات (MySQL pool/Promise)
│   │   ├── schema.sql                 # ملف SQL لإنشاء الجداول الأساسية
│   │   ├── create_settings.sql        # إدخالات أولية لجدول الإعدادات
│   │   ├── init-db.js                 # سكربت تهيئة القاعدة (JS)
│   │   ├── fix-passwords.js           # سكربت لإصلاح/تحديث كلمات المرور (مثلاً إعادة تجزئة)
│   │   └── test-login.js              # سكربت اختباري لتسجيل الدخول
│   ├── middleware/
│   │   └── auth.middleware.js         # Middleware للمصادقة (JWT، authorizeAdmin ..)
│   └── routes/
│       ├── auth.routes.js             # مسارات المصادقة (login/register/logout)
│       ├── settings.routes.js         # مسارات جلب/تحديث إعدادات النظام
│       ├── dashboard.routes.js        # نقاط وصول إحصائيات لوحة التحكم
│       ├── student.routes.js          # CRUD للطلاب
│       ├── teacher.routes.js          # بيانات المعلمين
│       ├── class.routes.js            # إدارة الصفوف
│       ├── subject.routes.js          # إدارة المواد
│       ├── schedule.routes.js         # إدارة الجداول
│       ├── attendance.routes.js       # تسجيل/جلب الحضور
│       ├── grade.routes.js            # نقاط الدخول الخاصة بالدرجات
│       ├── announcement.routes.js     # إدارة الإعلانات
│       ├── message.routes.js          # الرسائل الداخلية
│       ├── parent.routes.js           # وظائف تخص أولياء الأمور
│       └── user.routes.js             # إدارة المستخدمين
│
├── controllers/                       # منطق التطبيق (Business logic)
│   ├── auth.controller.js             # وظائف المصادقة: login/register/verify/change-password
│   ├── settings.controller.js         # getAllSettings, updateSettings
│   ├── dashboard.controller.js        # تجميع الإحصائيات والبيانات للوحة
│   ├── student.controller.js          # CRUD الطلاب + درجات/حضور طالب
│   ├── teacher.controller.js          # CRUD المعلمين
│   ├── class.controller.js            # CRUD الصفوف
│   ├── subject.controller.js          # إدارة المواد وربطها
│   ├── schedule.controller.js         # إدارة الجداول الزمنية
│   ├── attendance.controller.js       # تسجيل الحضور/غياب
│   ├── grade.controller.js            # إدخال/جلب الدرجات
│   ├── announcement.controller.js     # إضافة/عرض الإعلانات
│   ├── message.controller.js          # إرسال/استقبال الرسائل
│   ├── parent.controller.js           # عمليات متعلقة بولي الأمر
│   └── user.controller.js             # إدارة المستخدمين (قائمة، تفاصيل)
│
├── public/                            # واجهة المستخدم الثابتة (Static frontend)
│   ├── assist/                        # موارد مساعدة (شعارات، صور hero..)
│   │   └── logo.jpg
│   ├── images/                        # صور واجهة عامة
│   ├── uploads/                       # ملفات مرفوعة من قبل المستخدمين
│   │   └── avatars/                   # صور ملفات المستخدمين (محفوظة محلياً)
│   ├── css/
│   │   └── main.css                   # ملف الأنماط الرئيسي للجميع
│   ├── js/
│   │   ├── common.js                  # وظائف مساعدة، تعريف `API_URL`, checkAuth()
│   │   ├── login.js                   # تسجيل الدخول + toggle password + toasts
│   │   ├── load-settings.js           # تحميل إعدادات النظام إلى الواجهة (Footer..)
│   │   ├── dashboard.js               # لوجيك لوحة التحكم (إحصائيات، widgets)
│   │   ├── attendance.js              # واجهة الحضور
│   │   ├── grades.js                  # واجهة الدرجات
│   │   ├── messages.js                # واجهة الرسائل
│   │   ├── parent-view.js             # صفحة عرض ولي الأمر
│   │   ├── parents.js                 # إدارة أولياء الأمور
│   │   ├── schedules.js               # إدارة الجداول
│   │   └── users-management.js        # إدارة مستخدمي النظام من الواجهة
│   ├── index.html                     # الصفحة الرئيسية
│   ├── login.html                     # صفحة تسجيل الدخول
│   ├── dashboard.html                 # واجهة اللوحة
│   ├── students.html                  # صفحة إدارة الطلاب (قوائم، إضافة، تعديل)
│   ├── teachers.html                  # صفحة إدارة المعلمين
│   ├── parents.html                   # صفحة إدارة أولياء الأمور
│   ├── classes.html                   # إدارة الصفوف والمواد
│   ├── schedules.html                 # عرض/تحرير الجداول
│   ├── attendance.html                # واجهة الحضور/الغياب
│   ├── grades.html                    # إدخال/عرض الدرجات
│   ├── messages.html                  # صندوق الرسائل
│   ├── users-management.html          # إدارة المستخدمين والأدوار
│   ├── settings.html                  # صفحة إعدادات النظام (واجهة المدير)
│   ├── profile.html                   # صفحة إعداد الملف الشخصي
│   ├── privacy.html                   # سياسة الخصوصية
│   └── about.html                     # صفحة من نحن
│
├── scripts/                           # سكربتات مساعدة وتعبئة بيانات
│   ├── seed_classes.js                # تعبئة بيانات الصفوف
│   ├── reset_and_seed_classes.js      # إعادة تعبئة بيانات الصفوف (اختباري)
│   └── make_email_optional.js         # تعديل المخطط/بيانات لاختبار البريد
│
├── database/                          # (مجلد إضافي للنسخ/أدوات) - قد يكون مرآة داخل backend
│   └── (قد يحتوي على schema.sql, connection.js - يُرجع للمجلد backend/database)
│
└── docs/ (أو root docs files)
    ├── README.md                      # دليل المشروع
    ├── PROJECT_SUMMARY.md             # ملخص المشروع
    ├── NETLIFY_DEPLOYMENT_GUIDE.md    # دليل النشر
    └── USER_GUIDE.md                  # دليل المستخدم

```

---

## وصف تفصيلي لكل ملف / مجلد (حسب الأهمية)

### ملفات الجذر
- `server.js`:
  - نقطة بدء الخادم. عادة يقوم بتهيئة Express، إضافة الـ middleware (CORS, bodyParser, passport إذا وُجد)، تعريف المسارات (`/api/*`)، وربط قاعدة البيانات ثم الاستماع على `process.env.PORT || 3000`.

- `package.json`:
  - يحتوي تبعيات المشروع، سكربتات التشغيل (`start`, `dev`)، وخصائص المشروع (name, version).

- `.env.example`:
  - نموذج مفاتيح البيئة (DB_HOST, DB_USER, DB_PASS, JWT_SECRET, ...). يُستخدم كمرجع للمطورين.

- `.gitignore`:
  - يمنع رفع `node_modules/`, `uploads/`, وملفات البيئة إلى المستودع.

- `NETLIFY_DEPLOYMENT_GUIDE.md`:
  - دليل مكوّن سابقًا يشرح كيفية نشر الواجهة على Netlify وفصل الواجهة/الخادم.

- `README.md`, `PROJECT_SUMMARY.md`, `USER_GUIDE.md`:
  - ملفات توثيقية تشرح المشروع، كيفية تشغيله ووظائفه.

### `backend/` و `backend/database/`
- `backend/database/connection.js`:
  - تهيئة اتصال MySQL (باستخدام `mysql2/promise` أو `mysql`). يُعرّف pool وأحيانًا وظائف مساعدة `query()`.

- `backend/database/schema.sql`:
  - يحتوي تعريف جميع الجداول: `users`, `students`, `teachers`, `classes`, `subjects`, `class_subjects`, `schedules`, `attendance`, `grades`, `announcements`, `messages`, `holidays`, `system_settings`.

- `backend/database/create_settings.sql`:
  - سكربت لإدخال قيم إعدادات افتراضية مثل `contact_email`, `contact_phone`, `contact_address`, `facebook_url`.

- `backend/database/init-db.js`, `fix-passwords.js`, `test-login.js`:
  - أدوات لتشغيل/تهيئة قاعدة البيانات، إصلاح بيانات أو اختبار التسجيل.

### `backend/middleware/auth.middleware.js`
- يتضمن عادة دوال مثل `authenticateToken(req, res, next)` للتحقق من JWT و `authorizeAdmin(req, res, next)` للتحقق من دور.

### `backend/routes/*.js` و `controllers/*.js`
- كل ملف route يعين المسارات (HTTP) ويستدعي الدوال المناسبة من `controllers`.
- على سبيل المثال `settings.routes.js` قد يحتوي:
```js
router.get('/', settingsController.getAllSettings);
router.post('/', authenticateToken, authorizeAdmin, settingsController.updateSettings);
```
- أما `controllers/settings.controller.js` فتنفذ العمليات على جدول `system_settings` (جلب كل الإعدادات بتحويلها إلى كائن key/value، أو تحديث القيم باستخدام upsert).

### `public/` (Frontend)
- `public/index.html`:
  - الصفحة الرئيسية. تستخدم موارد CSS/JS من `public/css/main.css` و `public/js/*`.

- `public/login.html` و `public/js/login.js`:
  - صفحة تسجيل الدخول + معالجة إرسال بيانات النموذج إلى `/api/auth/login`، تخزين الـ JWT في localStorage، وإضافة زر إظهار/إخفاء كلمة المرور.

- `public/settings.html` و `public/js/load-settings.js`:
  - واجهة المدير لتعديل إعدادات النظام (contact + social links). الصفحة تقرأ القيم عبر `GET /api/settings` وتملأ الحقول.
  - عند حفظها ترسل `POST /api/settings` مع توكن الإدارة.

- `public/js/load-settings.js`:
  - يملأ محتويات الفوتر (العنوان، البريد، الهاتف) كما يظهر في `index.html`، ويعرض روابط التواصل الاجتماعي فقط إذا كانت موجودة في الإعدادات.

- `public/js/common.js`:
  - يحتوي وظائف عامة مثل `checkAuth()`, `showToast()`, وربما تعريف `API_URL` لبيئة التطوير.

- بقية صفحات `public/*.html` وملفات `public/js/*` مرتبطة بأقسام النظام (الطلاب، المعلمين، الحضور، الدرجات، الرسائل) وتستدعي نقاط النهاية المناسبة.

### `scripts/`
- سكربتات لمرة واحدة أو للتطوير مثل تعبئة بيانات تجريبية أو تغيير هيكلية.

---

## ملاحظات عملية
- إعدادات النظام مخزنة في جدول `system_settings` وتُقرأ ككائن key/value — هذا يسهل إضافة إعدادات جديدة بدون تعديل سكيمات.
- روابط التواصل الاجتماعي تُعامل كحقل اختياري: إذا كان الحقل فارغًا لا يتم إظهار الرابط في الواجهة.
- لإستضافة الواجهة فقط، يتم نشر `public/` على Netlify وتهيئة `netlify.toml` وتهيئة Redirects نحو الـ API المستضاف خارجيًا.

---

## ما قمت به هنا
- جمعت الشجرة الحقيقية للمشروع من بيئة العمل وأدخلت توصيف وظيفي لكل مجلد/ملف أساسي.
- هذا الملف مهيأ ليكون مرجعًا داخل المشروع للمطورين القادمين.

---

## الخطوة التالية المقترحة
- إذا رغبت، أستطيع:
  - 1) تحديث `README.md` ليتضمن مقتطفًا من هذا الملف.
  - 2) إنشاء نسخة مختصرة `TREE.md` لعرض سريع.
  - 3) توليد أمر `tree /F` نصي وحفظ الناتج في ملف `TREE_RAW.txt` إذا احتجت قائمة حرفية لكل ملف.

أخبرني أي خيار تفضّل.
