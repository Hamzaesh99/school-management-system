# دليل استضافة المشروع على Netlify
## نظام إدارة المدرسة - School Management System

---

## المحتويات
1. [المتطلبات](#المتطلبات)
2. [إعداد المشروع](#إعداد-المشروع)
3. [إنشاء حساب Netlify](#إنشاء-حساب-netlify)
4. [نشر المشروع](#نشر-المشروع)
5. [إعدادات قاعدة البيانات](#إعدادات-قاعدة-البيانات)
6. [متغيرات البيئة](#متغيرات-البيئة)
7. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## المتطلبات

قبل البدء، تأكد من توفر الآتي:

✅ حساب GitHub (مجاني)
✅ حساب Netlify (مجاني)
✅ حساب قاعدة بيانات MySQL (مثل Railway أو Heroku Postgres)
✅ Node.js و npm مثبتة على جهازك
✅ Git مثبتة على جهازك

---

## إعداد المشروع

### 1. تحضير المشروع المحلي

```bash
# الانتقال إلى مجلد المشروع
cd "c:\Users\HP\Desktop\System school tauswol"

# تهيئة Git (إذا لم يتم بعد)
git init

# إضافة الملفات
git add .

# أول commit
git commit -m "Initial commit - School Management System"
```

### 2. إنشاء ملف `.gitignore`

تأكد من وجود ملف `.gitignore` يحتوي على:

```
node_modules/
.env
.env.local
.DS_Store
*.log
uploads/
```

### 3. تحديث `package.json`

تأكد من وجود الأوامر التالية في `package.json`:

```json
{
  "name": "school-management-system",
  "version": "1.0.0",
  "description": "نظام إدارة المدرسة",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'Build complete'"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 4. إنشاء ملف `Procfile`

أنشئ ملف باسم `Procfile` (بدون امتداد) في جذر المشروع:

```
web: node server.js
```

### 5. تحديث `server.js`

تأكد من أن `server.js` يستخدم متغير البيئة للـ PORT:

```javascript
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

---

## إنشاء حساب Netlify

### الخطوة 1: الذهاب إلى Netlify

1. اذهب إلى [https://www.netlify.com](https://www.netlify.com)
2. انقر على **"Sign up"** (التسجيل)
3. اختر **"Sign up with GitHub"** لتسهيل العملية

### الخطوة 2: الربط مع GitHub

1. وافق على الصلاحيات المطلوبة
2. سيتم توجيهك إلى لوحة التحكم

---

## نشر المشروع

### الطريقة 1: النشر من GitHub (الموصى به)

#### أ. رفع المشروع إلى GitHub

```bash
# إضافة المستودع البعيد
git remote add origin https://github.com/YOUR_USERNAME/school-management-system.git

# تغيير اسم الفرع الرئيسي إلى main (إذا لزم)
git branch -M main

# رفع المشروع
git push -u origin main
```

#### ب. ربط Netlify مع GitHub

1. في لوحة تحكم Netlify، انقر على **"New site from Git"**
2. اختر **"GitHub"**
3. ابحث عن المستودع `school-management-system`
4. اختر الفرع الرئيسي (`main`)
5. في **Build settings**:
   - **Build command**: `npm run build` أو اتركها فارغة
   - **Publish directory**: `.` (الجذر - للعميل والخادم معاً)
6. انقر على **"Deploy site"**

### الطريقة 2: النشر اليدوي (Drag & Drop)

⚠️ **ملاحظة**: هذه الطريقة للمشاريع الثابتة فقط، لا تعمل للخوادم Node.js

---

## إعدادات قاعدة البيانات

### الخيار 1: استخدام Railway (الموصى به)

#### 1. إنشاء حساب Railway

- اذهب إلى [https://railway.app](https://railway.app)
- سجل الدخول باستخدام GitHub

#### 2. إنشاء خدمة MySQL

1. في لوحة Railway، انقر على **"New"**
2. اختر **"Database"** → **"MySQL"**
3. انتظر إنشاء قاعدة البيانات
4. سيحصل على بيانات الاتصال:
   - **Host**
   - **Port**
   - **User**
   - **Password**
   - **Database**

#### 3. استيراد البيانات الأولية

```bash
# من خلال MySQL Workbench أو Command Line
mysql -h YOUR_HOST -u YOUR_USER -p YOUR_PASSWORD YOUR_DATABASE < database/schema.sql
```

### الخيار 2: استخدام Heroku Postgres

1. اذهب إلى [https://www.heroku.com](https://www.heroku.com)
2. أنشئ تطبيق جديد
3. أضف PostgreSQL كمُضافة

---

## متغيرات البيئة

### إعداد متغيرات البيئة في Netlify

⚠️ **تنبيه مهم**: لا يمكن استضافة خادم Node.js على Netlify مباشرة. 
استخدم **Netlify Functions** أو **احترق الخادم على منصة أخرى**.

### الحل الموصى به: فصل الواجهة الأمامية والخلفية

#### أ. استضافة الواجهة الأمامية على Netlify

1. أنسخ مجلد `public` فقط
2. في `netlify.toml`:

```toml
[build]
  command = "echo 'Frontend ready'"
  publish = "public"

[[redirects]]
  from = "/api/*"
  to = "YOUR_BACKEND_URL/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### ب. استضافة الخادم الخلفي على منصة أخرى

خيارات:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **Glitch**: https://glitch.com

### إعداد متغيرات البيئة

في لوحة Netlify:

1. اذهب إلى **Site settings** → **Build & deploy**
2. انقر على **Environment**
3. أضف المتغيرات:

```
API_URL = https://your-backend-server.com
DB_HOST = your-database-host
DB_USER = your-db-user
DB_PASS = your-db-password
DB_NAME = school_management
```

---

## خطوات النشر الكاملة

### 1. إعداد قاعدة البيانات على Railway

```bash
# تسجيل الدخول إلى Railway
railway login

# ربط المشروع
railway link

# استيراد البيانات
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < database/schema.sql
```

### 2. نشر الخادم على Railway

```bash
# دفع التطبيق
railway deploy
```

احصل على رابط الخادم من Railway dashboard.

### 3. نشر الواجهة على Netlify

```bash
# تثبيت Netlify CLI (اختياري)
npm install -g netlify-cli

# تسجيل الدخول
netlify login

# نشر
netlify deploy --prod
```

### 4. تحديث متغيرات البيئة

في `public/js/common.js`:

```javascript
const API_URL = 'https://your-railway-backend.up.railway.app/api';
```

---

## اختبار الاتصال

### 1. التحقق من الاتصال بقاعدة البيانات

```bash
# في مجلد المشروع
npm start

# ثم افتح المتصفح
http://localhost:3000
```

### 2. التحقق من API

```bash
curl https://your-railway-backend.up.railway.app/api/settings
```

يجب أن ترى JSON بالإعدادات.

---

## استكشاف الأخطاء

### المشكلة: "Cannot find module"

```bash
# حل:
rm -rf node_modules
npm install
```

### المشكلة: اتصال قاعدة البيانات فاشل

1. تحقق من بيانات الاتصال
2. تأكد من أن قاعدة البيانات مفتوحة للاتصالات العامة
3. تحقق من جدار الحماية

### المشكلة: CORS errors

في `server.js`:

```javascript
const cors = require('cors');

app.use(cors({
    origin: ['https://your-netlify-domain.netlify.app', 'http://localhost:3000'],
    credentials: true
}));
```

### المشكلة: متغيرات البيئة لم تُحمّل

تأكد من:
1. إضافتها في **Site settings** → **Environment**
2. إعادة بناء الموقع بعد الإضافة
3. استخدام `process.env.VARIABLE_NAME` بشكل صحيح

---

## روابط مفيدة

| الخدمة | الرابط |
|--------|--------|
| Netlify | https://www.netlify.com |
| Railway | https://railway.app |
| GitHub | https://github.com |
| MySQL Workbench | https://www.mysql.com/products/workbench/ |
| Node.js | https://nodejs.org |

---

## خطوات سريعة (ملخص)

```bash
# 1. تحضير المشروع
git init
git add .
git commit -m "Initial commit"

# 2. رفع على GitHub
git remote add origin https://github.com/YOUR_USERNAME/school-management-system.git
git push -u origin main

# 3. إنشاء قاعدة بيانات على Railway وملاحظة البيانات

# 4. نشر على Netlify من GitHub dashboard

# 5. تحديث API_URL في public/js/common.js

# 6. اختبار في المتصفح
https://your-netlify-domain.netlify.app
```

---

## دعم إضافي

للمساعدة:
- 📚 [Netlify Docs](https://docs.netlify.com)
- 📚 [Railway Docs](https://docs.railway.app)
- 💬 [Netlify Community](https://community.netlify.com)

---

**تم إنشاء هذا الدليل في**: ديسمبر 2025
**إصدار المشروع**: 1.0.0
