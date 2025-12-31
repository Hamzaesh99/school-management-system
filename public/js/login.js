// `API_URL` الآن يُعرّف في `common.js`، تأكد من تحميل `common.js` قبل هذا الملف في صفحات HTML

// Global Toast Notification System
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

// عرض رسالة خطأ
// عرض رسالة خطأ
function showError(message) {
    if (typeof showToast === 'function') {
        showToast(message, 'error');
    } else {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
        } else {
            alert(message);
        }
    }
}

// عرض رسالة نجاح
function showSuccess(message) {
    if (typeof showToast === 'function') {
        showToast(message, 'success');
    } else {
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => { successDiv.style.display = 'none'; }, 3000);
        } else {
            alert(message);
        }
    }
}

// معالج تسجيل الدخول
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // حفظ التوكن ومعلومات المستخدم
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');

            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            showError(data.message || 'فشل تسجيل الدخول');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى');
    }
});

// ============================================
// وظيفة إظهار/إخفاء كلمة المرور
// Toggle Password Visibility Function
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // التبديل بين نوع الإدخال
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordBtn.querySelector('.toggle-icon').textContent = '🙈';
                togglePasswordBtn.title = 'إخفاء كلمة المرور';
            } else {
                passwordInput.type = 'password';
                togglePasswordBtn.querySelector('.toggle-icon').textContent = '👁️';
                togglePasswordBtn.title = 'إظهار كلمة المرور';
            }
        });
    }
});
