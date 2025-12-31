# دليل نشر المشروع

دليل مفصّل ودقيق لخطوات نشر الواجهة على Netlify والخادم (Backend) وقاعدة البيانات على Railway.

هذا الدليل مكتوب خطوة‑بخطوة مع أوامر PowerShell (ويندوز) وأمثلة إعداد `netlify.toml`, `Procfile`, وإرشادات متعلقة بالبيئات والمتغيرات.

---

**افتراضات قبل البدء**
- لديك حساب GitHub.
- لديك حساب Netlify وحساب Railway.
- المشروع محليًا في: `c:\Users\HP\Desktop\System school tauswol`
- الواجهة الثابتة موجودة في مجلد `public/` (كما هو الحال هنا).
- الخادم الخلفي مبني بـ Node/Express وملف الدخول هو `server.js`.

---

## نظرة عامة على الخطة
1. رفع المشروع إلى GitHub (أو التأكد أنه موجود على GitHub).
2. نشر الواجهة (مجلد `public/`) على Netlify عبر الربط بالمستودع أو رفع مباشر.
3. نشر الخادم الخلفي على Railway.
4. إنشاء قاعدة بيانات MySQL على Railway واستيراد `schema.sql` وبيانات الإعداد الأولية.
5. إعداد متغيرات البيئة في Netlify وRailway (API_URL، DB_*، JWT_SECRET، إلخ).
6. إعداد Redirects في Netlify ليتم توجيه طلبات `/api/*` إلى رابط الخادم الخلفي (أو ضبط `API_URL` في الواجهة).
7. اختبار النظام والنشر التلقائي (CI/CD).

---

## 1) رفع المشروع إلى GitHub

إذا لم تكن قد رفعت المشروع بعد، قم بالتالي في PowerShell:

```powershell
cd "c:\Users\HP\Desktop\System school tauswol"
# تهيئة git (إذا لم تفعل بعد)
git init
git add .
git commit -m "Initial commit - School Management System"
# أنشئ المستودع في GitHub ثم أضف remote
git remote add origin https://github.com/YOUR_USERNAME/school-management-system.git
git branch -M main
git push -u origin main
```

استبدل `YOUR_USERNAME` واسم المستودع حسب حسابك.

---

## 2) استضافة الواجهة على Netlify

هناك طريقتان شائعتان:
- ربط Netlify مباشرة بالمستودع GitHub (مفضل) — Netlify ينشر تلقائياً عند كل دفع (push).
- رفع مجلد `public/` يدوياً عبر واجهة Netlify أو `netlify deploy`.

نوصي بالطريقة الأولى (GitHub → Netlify).

### 2.1 إعداد `netlify.toml` (موصى به)

إنشاء ملف `netlify.toml` في جذر المشروع (يسهّل الإعداد والـ redirects):

```toml
[build]
  command = "echo 'Frontend ready'"
  publish = "public"

# أي طلب إلى /api/* سيتم توجيهه إلى backend خارجي
[[redirects]]
  from = "/api/*"
  to = "https://YOUR_BACKEND_URL/api/:splat"
  status = 200

# توجيه جميع المسارات إلى index.html (SPA fallback)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> ملاحظة: إذا استخدمت redirect كما أعلاه فأنت تُعيد توجيه أي طلب `fetch('/api/...')` من المتصفح إلى الرابط الخارجي تلقائياً، فلا تحتاج لتغيير كثير في الواجهة.

### 2.2 نشر من GitHub (خطوات سريعة)

1. افتح لوحة Netlify → Sites → New site from Git.
2. اختَر Git provider (GitHub) ثم سمح للصلاحيات.
3. اختَر المستودع `school-management-system` و branch `main`.
4. عند إعداد Build settings:
   - Build command: `npm run build` (إن كانت الواجهة تتطلب بناء) أو اترك `echo 'Frontend ready'` إن كانت الواجهة جاهزة داخل `public/`.
   - Publish directory: `public`
5. انقر Deploy site.

بعد النشر ستُعطى Netlify عنوانًا مؤقتًا (`*.netlify.app`).

### 2.3 إعداد متغيرات بيئة على Netlify

اذهب إلى `Site settings` → `Build & deploy` → `Environment` → `Edit variables`، وأضف (كمثال):

- `API_URL` = `https://your-railway-backend.up.railway.app/api`

بهذا الأسلوب يمكنك ضبط `API_URL` في الواجهة من المتغيرات بدلًا من تعديل الملفات مباشرة.

> ملاحظة: إذا استخدمت النهج `netlify.toml` لتوجيه `/api/*`، قد لا تحتاج لتعيين `API_URL` في الواجهة — لكن من الأفضل ضبط `API_URL` أيضاً كي تعمل على بيئات محلية.

### 2.4 رفع سريع عبر Netlify CLI (اختياري)

```powershell
npm install -g netlify-cli
netlify login
# نشر مسودة
netlify deploy --dir=public
# ثم لنشر إنتاجي
netlify deploy --prod --dir=public
```

---

## 3) نشر الخادم (Backend) على Railway

Railway خدمة سريعة وسهلة لاستضافة تطبيقات Node وقواعد بيانات.

### 3.1 إنشاء مشروع على Railway

1. اذهب إلى https://railway.app وادخل بحساب GitHub.
2. أنشئ مشروعًا جديدًا (`New Project`).
3. اختر `Deploy from GitHub repo` أو `Start from template`، أو `Deploy a service` ثم `Node.js`.

### 3.2 تجهيز المشروع للنشر

- تأكد من أن `server.js` يستمع على `process.env.PORT` وليس رقم ثابت:

```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
```

- تأكد من وجود `start` script في `package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

- ضع `engines` إن رغبت تحديد نسخة Node:

```json
"engines": { "node": "18.x" }
```

### 3.3 إضافة قاعدة بيانات MySQL على Railway

داخل Railway:
1. اختر `New` → `Provision Postgres` أو `Provision MySQL` (اختر MySQL إن كان مشروعك يستخدم MySQL).
2. Railway سينشئ قاعدة بيانات ويعطيك متغيرات اتصال مثل: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_PORT`.

### 3.4 ربط متغيرات البيئة (Env vars)

في إعدادات الخدمة على Railway، أضف متغيرات البيئة الضرورية التي يستخدمها `server.js` وملفات الاتصال مثل:

- `DB_HOST` أو `MYSQL_HOST`
- `DB_USER` أو `MYSQL_USER`
- `DB_PASS` أو `MYSQL_PASSWORD`
- `DB_NAME` أو `MYSQL_DATABASE`
- `JWT_SECRET`
- أي متغير آخر (S3 keys, MAIL settings ...)

Railway عادة يعرض متغير اتصال واحد `DATABASE_URL` أيضاً.

### 3.5 نشر الخادم من GitHub

- رشّح مستودع GitHub و الفرع المناسب.
- عند كل دفع (push) إلى الفرع، Railway سيبني ويُعيد نشر التطبيق تلقائيًا.

### 3.6 استيراد `schema.sql` وبيانات بذرية

بعد إنشاء قاعدة البيانات ستحتاج إلى استيراد المخطط والبيانات الأولية:

- الطريقة الأسهل: استخدم Railway Run أو استخدم الأمر `mysql` محليًا باستخدام بيانات الاتصال.

مثال (PowerShell):

```powershell
# تثبيت mysql client إن لم يكن مثبتًا
# ثم تنفيذ استيراد
mysql -h YOUR_DB_HOST -P YOUR_DB_PORT -u YOUR_DB_USER -pYOUR_DB_PASSWORD YOUR_DB_NAME < backend/database/schema.sql
```

أو عبر Railway CLI:

```powershell
# بعد ربط Railway CLI (اختياري)
railway login
railway link
railway run "mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backend/database/schema.sql"
```

> تأكد من إدخال أي سكربتات إدخال افتراضية `create_settings.sql` بعد الاستيراد.

### 3.7 نشر تلقائي عبر GitHub Actions (Railway)

يمكنك إعداد GitHub Actions ليقوم بنشر الـ backend إلى Railway تلقائيًا عند كل دفع (push) إلى الفرع `main`.
المتطلبات الأساسية:
- `RAILWAY_API_KEY`: مفتاح API لحساب Railway (أدخله كسِر في إعدادات GitHub → Repository → Secrets → Actions).
- `RAILWAY_PROJECT_ID`: (اختياري) معرّف المشروع في Railway، مفيد إذا لم تكن قد ربطت المستودع بالمشروع من واجهة Railway.

نموذج Workflow تم تضمينه في `.github/workflows/deploy-backend-railway.yml` داخل المستودع. يركّب Railway CLI، يقوم بتسجيل الدخول عبر `RAILWAY_API_KEY` ثم يُشغّل أمر النشر (`railway up` أو `railway deploy`).

ملاحظات:
- تأكد أن تطبيقك يستخدم `process.env.PORT` و `start` script في `package.json` (ملف `package.json` في المشروع يحتوي الآن على `"start": "node server.js"`).
- متغيّرات الاتصال بقاعدة البيانات (مثل `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`) يجب ضبطها في لوحة Railway (Service → Variables) وليس كأسرار GitHub عادة.

### 3.8 تعبئة أسرار GitHub وNetlify — كيفية الحصول على القيم وضبطها

في ما يلي قائمة بالأسرار (secrets) التي تحتاج لإعدادها في مستودع GitHub لإتاحة النشر التلقائي وتشغيل الـ build بشكل صحيح، مع شرح أين تجد كل قيمة وكيف تضيفها باستخدام واجهة الويب أو `gh` CLI.

- `API_URL` (Repository secret):
  - ما هو: رابط الـ API النهائي للـ backend الذي ستستعمله الواجهة، مثال: `https://your-railway.up.railway.app/api`.
  - أين تحصل عليه: بعد نشر الـ backend على Railway ستجد عنوان الخدمة في لوحة المشروع (Service URL).
  - كيف تضيفه (واجهة GitHub): Repository → Settings → Secrets and variables → Actions → New repository secret → اسم: `API_URL` → القيمة.
  - كيف تضيفه (gh CLI, داخل المجلد المحلي للمستودع):

    ```powershell
    gh secret set API_URL --body "https://your-railway.up.railway.app/api"
    ```

- `NETLIFY_AUTH_TOKEN` (Repository secret):
  - ما هو: توكن وصول شخصي من Netlify يسمح لعملية CI بنشر الموقع.
  - أين تحصل عليه: في Netlify → User settings → Applications → Personal access tokens → New access token.
  - كيف تضيفه (واجهة GitHub): أضف secret باسم `NETLIFY_AUTH_TOKEN`.
  - كيف تضيفه (gh CLI):

    ```powershell
    gh secret set NETLIFY_AUTH_TOKEN --body "<your-netlify-token>"
    ```

- `NETLIFY_SITE_ID` (Repository secret):
  - ما هو: معرّف موقع Netlify الخاص بك (Site ID) المستخدم بواسطة الـ Action لنشر إلى الموقع الصحيح.
  - أين تجده: Netlify → Sites → اختَر موقعك → Site settings → Site information → Site ID.
  - كيف تضيفه (gh CLI):

    ```powershell
    gh secret set NETLIFY_SITE_ID --body "<your-site-id>"
    ```

- `RAILWAY_API_KEY` (Repository secret):
  - ما هو: مفتاح API لحساب Railway يستخدمه الـ Action لتسجيل الدخول عبر CLI.
  - أين تحصل عليه: Railway → Account settings (User settings) → API Keys → Create New API Key.
  - كيف تضيفه (gh CLI):

    ```powershell
    gh secret set RAILWAY_API_KEY --body "<your-railway-api-key>"
    ```

- `RAILWAY_PROJECT_ID` (Repository secret — اختياري):
  - ما هو: معرّف المشروع في Railway؛ يفيد إذا لم تكن قد ربطت المخزن بالمشروع عبر واجهة Railway.
  - أين تجده: عنوان URL للمشروع في Railway أو شاشة Project settings.
  - كيف تضيفه (gh CLI):

    ```powershell
    gh secret set RAILWAY_PROJECT_ID --body "<your-project-id>"
    ```

ملاحظات أمنيّة وأفضل الممارسات:
- لا تضَع المفاتيح أو التوكنات في نصوص الكود أو ملفات `.env` في المستودع.
- إذا كنت تفضّل عدم استخدام مفاتيح API في GitHub Actions، يمكنك استخدام Railway GitHub App لربط المستودع بخدمة Railway بدون إعطاء توكن مباشر؛ راجع وثائق Railway حول GitHub integration.

اختبار وإطلاق الـ workflow يدويًا:
- أبسط طريقة لتفعيل الـ workflow هي إجراء دفع (push) إلى الفرع `main` بعد إضافة الأسرار.
- بدلاً من ذلك يمكنك إعادة تشغيل الـ workflow من GitHub → Actions → اختر الـ workflow → Run workflow (إن كان يدعم `workflow_dispatch`).

أمثلة تشغيل محلي لتوليد `public/config.json` (PowerShell):

```powershell
$env:API_URL = 'https://your-railway.up.railway.app/api'
node scripts/generate-config.js
# ثم تحقق من public/config.json
Get-Content .\public\config.json
```

بعد تعبئة الأسرار في GitHub، ادفع التغييرات إلى `main` لبدء عملية البناء والنشر، ثم راجع:
- GitHub Actions logs (لوحة Actions في المستودع).
- Netlify deploys (لوحة Netlify) لرؤية النشر ووضع الموقع.
- Railway project logs وService URL لمعرفة حالة نشر الـ backend.

---

## 4) وصل الواجهة بالـ Backend (تكوين API_URL / Redirects)

هناك خياران رئيسيان:

A) اضبط `API_URL` في الواجهة إلى الرابط النهائي لخادم Railway (`https://your-railway.up.railway.app/api`).
- يتم ذلك إما بتعديل `public/js/common.js` قبل نشر، أو عبر متغير بيئة في Netlify (مفضل).

B) اضبط Redirects في Netlify بحيث أي طلب `/api/*` يُعاد توجيهه تلقائياً إلى الخادم الخلفي.
- مثال في `netlify.toml` استخدمنا:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-railway-backend.up.railway.app/api/:splat"
  status = 200
```

الخيار (B) مهم إذا تريد أن تترك الواجهة تعمل كما هي وتوجّه أي نداءات API دون تعديل الكود.

### 4.1 تحديث `common.js` باستخدام Netlify env var

بديلاً عن تحرير الملفات يدوياً، ضع متغير `API_URL` في Netlify: 
`API_URL=https://your-railway-backend.up.railway.app/api`

وفي الواجهة `public/js/common.js` استخدم القيمة من `window.__API_URL__` أو مجرد قراءة قيمة ثابتة عبر `process.env` لا تعمل في المتصفح مباشرة، لذلك الأسهل أن تضيف قبل تحميل `common.js` في Netlify ملف `config.js` يتم توليده في وقت البناء ويحمل المتغيرات.

مثال بسيط: أنشئ ملف `public/config.json` تلقائياً أثناء البناء (Netlify build step) ويحتوي:

```json
{
  "API_URL": "https://your-railway-backend.up.railway.app/api"
}
```

ثم في `common.js`:

```javascript
// تحميل الإعدادات من public/config.json عند بداية التطبيق
let API_URL = 'http://localhost:3000/api';
fetch('/config.json')
  .then(r => r.json())
  .then(cfg => { API_URL = cfg.API_URL; })
  .catch(() => {});
```

وهذا يسهّل تبديل القيم عبر Netlify build command الذي ينشئ `public/config.json` من متغيرات البيئة.

مثال build command في Netlify:

```bash
# داخل Build command في Netlify
node scripts/generate-config.js && echo 'Frontend ready'
```

ومحتوى `scripts/generate-config.js` بسيط يقرأ env vars ويكتب `public/config.json`.

---

## 5) إعداد CORS في الخادم

تأكد من أن الخادم يسمح بالمنشأ (origin) الخاص بـ Netlify (مثلاً `https://your-site.netlify.app`):

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://your-site.netlify.app', 'http://localhost:3000'],
  credentials: true
}));
```

بدون إعداد CORS الصحيح، سيحجب المتصفح الطلبات من الواجهة إلى الخادم.

---

## 6) الأمن والسرية (نقاط مهمة)

- لا تقم أبداً بضم كلمات مرور أو مفاتيح في ملفات في المستودع. استخدم متغيرات البيئة في Railway وNetlify.
- `JWT_SECRET` يجب أن يكون قيمة قوية محفوظة في متغير بيئة.
- تأكد أن `uploads/` لا تُخزن في Git وأنها مستبعدة بواسطة `.gitignore`.

---

## 7) فحص واختبار بعد النشر

1. افتح واجهة Netlify (`https://your-site.netlify.app`) وتحقق من تحميل الواجهة وأنها تَتّصل بالـ API.
2. في DevTools (Console/Network) تأكد من أن أي طلبات `/api/*` ترجع 200 أو 2xx.
3. جرّب تسجيل الدخول: يجب أن تستجيب نقطة `POST /api/auth/login` و تعيد token.
4. جرّب تحميل `GET /api/settings` للتأكد من أن الواجهة تعرض الإعدادات في الفوتر.

---

## 8) مشاكل شائعة وحلول

- 403 / CORS Error: تأكد من إعداد `cors()` على الخادم وإضافة origin الخاص بـ Netlify.
- 500 Server Error بعد النشر: راجع سجلات Railway (Logs) لمعرفة الاستثناءات.
- الاتصال بقاعدة البيانات فشل: تحقق من متغيرات الاتصال وسمح للقاعدة بالوصول من الخدمة.
- ملفات static لا تظهر: تأكد أن `publish` في Netlify هو `public` وأن `index.html` موجود.

---

## أمثلة أوامر سريعة (PowerShell)

نشر الواجهة عبر Netlify CLI (سريع):

```powershell
npm install -g netlify-cli
cd "c:\Users\HP\Desktop\System school tauswol"
# تسجيل دخول
netlify login
# نشر إنتاجي (يتطلب إعداد الموقع مسبقاً أو سير عمل تعامل المستخدم مع prompts)
netlify deploy --prod --dir=public
```

ربط و نشر backend على Railway (افتراضي، عبر GitHub التكامل هو الأسهل)

```powershell
# تثبيت Railway CLI إن رغبت
npm i -g railway
railway login
cd "c:\Users\HP\Desktop\System school tauswol"
railway init   # يربط المشروع مع Railway
railway up     # يدفع/ينشر الخدمة
```

لإدخال الـ schema إلى قاعدة البيانات:

```powershell
mysql -h YOUR_DB_HOST -P YOUR_DB_PORT -u YOUR_DB_USER -pYOUR_DB_PASSWORD YOUR_DB_NAME < backend/database/schema.sql
# ثم ملف create_settings.sql
mysql -h YOUR_DB_HOST -P YOUR_DB_PORT -u YOUR_DB_USER -pYOUR_DB_PASSWORD YOUR_DB_NAME < backend/database/create_settings.sql
```

---

## خاتمة ونصائح ختامية
- اصنع عملية Build تكتب `public/config.json` من متغيرات البيئة؛ هذا يبقي الواجهة قابلة للتبديل بسهولة بين البيئات.
- استخدم GitHub → Railway و GitHub → Netlify لوجود CI/CD آمن وسهل.
- احفظ أسرارك في متغيرات البيئة فقط (لا ترفع `.env`).
- اختبر عبر بيئة staging (فرع منفصل) قبل نشر الإنتاج.


---

إذا رغبت، أستطيع الآن:
- 1) إعداد ملف `scripts/generate-config.js` وتهيئة `netlify.toml` داخل المشروع تلقائياً.
- 2) تنفيذ خطوات ربط Netlify أو Railway من هنا إن رغبت بإرشاد تفاعلي.
- 3) كتابة نسخة مختصرة للعرض مع قائمة تحقق (checklist) للنشر السريع.

أخبرني أي خيار تريده أتبعه الآن.