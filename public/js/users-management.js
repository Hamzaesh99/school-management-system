// API_URL is defined in common.js
// const API_URL = 'http://localhost:3000/api';
let currentEditId = null;

// جلب التوكن
function getToken() {
    return localStorage.getItem('token');
}

// عرض رسالة
function showMessage(message, type = 'success') {
    if (typeof showToast === 'function') {
        showToast(message, type);
    } else {
        alert(message);
    }
}

// تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadUsers();
    loadClasses();
    loadParents();
});

// جلب الإحصائيات
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/users/stats`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            displayStats(data.data);
        }
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
    }
}

// عرض الإحصائيات
function displayStats(stats) {
    const roleNames = {
        admin: 'المدراء',
        teacher: 'المعلمون',
        student: 'الطلاب',
        parent: 'أولياء الأمور'
    };

    const roleIcons = {
        admin: '👤',
        teacher: '👨‍🏫',
        student: '👨‍🎓',
        parent: '👨‍👩‍👦'
    };

    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="stat-icon">${roleIcons[stat.role]}</div>
            <div class="stat-value">${stat.count}</div>
            <div class="stat-label">${roleNames[stat.role]}</div>
        </div>
    `).join('');
}

// جلب جميع المستخدمين
async function loadUsers() {
    try {
        console.log('Attemping to fetch users...');
        const response = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();
        console.log('Users data received:', data);

        if (data.success) {
            displayUsers(data.data);
        } else {
            console.error('Server error:', data.message);
            showMessage(data.message || 'فشل تحميل المستخدمين', 'error');
        }
    } catch (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        showMessage('حدث خطأ في تحميل البيانات', 'error');
    }
}

// عرض المستخدمين
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: var(--gray-600);">لا يوجد مستخدمين لعرضهم</td></tr>';
        return;
    }

    const roleNames = {
        admin: 'مدير',
        teacher: 'معلم',
        student: 'طالب',
        parent: 'ولي أمر'
    };

    const genderNames = { male: 'ذكر', female: 'أنثى' };

    tbody.innerHTML = users.map((user, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${user.username}</td>
            <td>${user.full_name}</td>
            <td><span class="role-badge role-${user.role}">${roleNames[user.role] || user.role}</span></td>
            <td>${user.email || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td>${user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('ar-EG') : '-'}</td>
            <td>${genderNames[user.gender] || '-'}</td>
            <td>${user.address || '-'}</td>
            <td><span class="status-badge status-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'نشط' : 'غير نشط'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn btn-edit" onclick="editUser(${user.user_id})" title="تعديل">
                        ✏️
                    </button>
                    <button class="action-btn btn-password" onclick="showPasswordModal(${user.user_id})" title="تغيير كلمة المرور">
                        🔒
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteUser(${user.user_id}, '${user.username}')" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// تحميل الصفوف
async function loadClasses() {
    try {
        const response = await fetch(`${API_URL}/classes`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        if (data.success) {
            const select = document.getElementById('studentClass');
            select.innerHTML = '<option value="">اختر الصف...</option>' +
                data.data.map(cls => `<option value="${cls.class_id}">${cls.class_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

// تحميل أولياء الأمور
async function loadParents() {
    try {
        const response = await fetch(`${API_URL}/parents`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();
        if (data.success) {
            const select = document.getElementById('studentParent');
            select.innerHTML = '<option value="">اختر ولي الأمر...</option>' +
                data.data.map(parent => `<option value="${parent.user_id}">${parent.full_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading parents:', error);
    }
}

// إظهار modal الإضافة
function showAddModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'إضافة مستخدم جديد';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('password').required = true;
    document.getElementById('statusGroup').style.display = 'none';

    // إعادة تعيين المتطلبات الافتراضية
    handleRoleChange();

    document.getElementById('userModal').classList.add('active');
}

// التعامل مع تغيير الدور لتحديث الحقول المطلوبة
function handleRoleChange() {
    const role = document.getElementById('role').value;
    const emailField = document.getElementById('email');
    const emailLabel = document.getElementById('emailLabel');
    const phoneField = document.getElementById('phone');
    const phoneLabel = phoneField.closest('.form-group').querySelector('.form-label');
    const dobField = document.getElementById('dateOfBirth');
    const dobLabel = document.getElementById('dobLabel');

    // إظهار/إخفاء حقول الطالب
    const studentFields = document.querySelectorAll('.student-only');
    studentFields.forEach(field => {
        field.style.display = role === 'student' ? 'block' : 'none';
    });

    // إجبار تحديث العرض
    if (role === 'student') {
        document.getElementById('studentClass').required = true;
        // قد لا يكون ولي الأمر إجباري في البداية، حسب المتطلبات. لنجعله اختياري للآن
    } else {
        document.getElementById('studentClass').required = false;
    }


    if (role === 'student') {
        // الطالب: البريد والهاتف اختياريان
        emailField.required = false;
        emailLabel.textContent = 'البريد الإلكتروني (اختياري)';

        phoneField.required = false;
        if (phoneLabel) phoneLabel.textContent = 'رقم الهاتف (اختياري)';

        dobField.required = true;
        dobLabel.textContent = 'تاريخ الميلاد*';
    } else {
        // الأدوار الأخرى
        emailField.required = true;
        emailLabel.textContent = 'البريد الإلكتروني*';

        phoneField.required = false;
        if (phoneLabel) phoneLabel.textContent = 'رقم الهاتف';

        if (role === 'teacher' || role === 'admin') {
            dobField.required = false;
            dobLabel.textContent = 'تاريخ الميلاد (اختياري)';
        } else {
            dobField.required = false;
            dobLabel.textContent = 'تاريخ الميلاد';
        }
    }
}

// إضافة مستمع لحدث تغيير الدور
document.getElementById('role').addEventListener('change', handleRoleChange);

// تعديل مستخدم
async function editUser(id) {
    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            currentEditId = id;
            const user = data.data;

            document.getElementById('modalTitle').textContent = 'تعديل بيانات المستخدم';
            document.getElementById('userId').value = user.user_id;
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('fullName').value = user.full_name;
            document.getElementById('role').value = user.role;
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('address').value = user.address || '';
            document.getElementById('dateOfBirth').value = user.date_of_birth ? user.date_of_birth.split('T')[0] : '';
            document.getElementById('gender').value = user.gender || '';
            document.getElementById('isActive').value = user.is_active ? '1' : '0';

            document.getElementById('passwordGroup').style.display = 'none';
            document.getElementById('password').required = false;
            document.getElementById('statusGroup').style.display = 'block';

            // تحديث المتطلبات حسب دور المستخدم عند التعديل
            handleRoleChange();

            // TODO: إذا كان طالب، يجب تحميل صفه وولي أمره وتعبئة الحقول.
            // حالياً API المستخدمين العاديين قد لا يرجع parent_id و class_id.
            // لكن بما أن المستخدم لم يطلب تعديل "الربط" من هنا بل فقط الإضافة، 
            // سأركز على الإضافة الآن. التعديل ممكن يتم من صفحة الطلاب.
            // لكن الأفضل أن يظهروا هنا أيضاً لو المستخدم طالب.

            document.getElementById('userModal').classList.add('active');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showMessage('حدث خطأ في تحميل بيانات المستخدم', 'error');
    }
}

// حفظ المستخدم (إضافة أو تعديل)
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        full_name: document.getElementById('fullName').value,
        role: document.getElementById('role').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        date_of_birth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value
    };

    if (userData.role === 'student') {
        const classId = document.getElementById('studentClass').value;
        const parentId = document.getElementById('studentParent').value;
        if (classId) userData.class_id = classId;
        if (parentId) userData.parent_id = parentId;
    }

    // إضافة كلمة المرور فقط للمستخدمين الجدد
    if (!currentEditId) {
        userData.password = document.getElementById('password').value;
    } else {
        userData.is_active = parseInt(document.getElementById('isActive').value);
    }

    try {
        const url = currentEditId
            ? `${API_URL}/users/${currentEditId}`
            : `${API_URL}/users`;

        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message);
            closeModal();
            loadStats();
            loadUsers();
            // استدعاء مزامنة الطلاب للتأكد
            fetch(`${API_URL}/students/sync-missing`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` } }).catch(e => console.error(e));
        } else {
            showMessage(data.message || 'فشلت العملية', 'error');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showMessage('حدث خطأ في الخادم', 'error');
    }
});

// حذف مستخدم
async function deleteUser(id, username) {
    const confirmed = await showConfirm(
        `هل أنت متأكد من حذف المستخدم "${username}"؟\nهذه العملية لا يمكن التراجع عنها.`,
        'تأكيد الحذف',
        'نعم، احذف',
        'إلغاء'
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message);
            loadStats();
            loadUsers();
        } else {
            showMessage(data.message || 'فشل الحذف', 'error');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showMessage('حدث خطأ في الخادم', 'error');
    }
}

// إظهار modal تغيير كلمة المرور
function showPasswordModal(userId) {
    document.getElementById('passwordUserId').value = userId;
    document.getElementById('passwordForm').reset();
    document.getElementById('passwordModal').classList.add('active');
}

// تغيير كلمة المرور
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showMessage('كلمة المرور غير متطابقة', 'error');
        return;
    }

    const userId = document.getElementById('passwordUserId').value;

    try {
        const response = await fetch(`${API_URL}/users/${userId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ new_password: newPassword })
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message);
            closePasswordModal();
        } else {
            showMessage(data.message || 'فشل تغيير كلمة المرور', 'error');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showMessage('حدث خطأ في الخادم', 'error');
    }
});

// إغلاق modal المستخدم
function closeModal() {
    document.getElementById('userModal').classList.remove('active');
}

// إغلاق modal كلمة المرور
function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('active');
}
