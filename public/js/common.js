const API_URL = 'http://localhost:3000/api';

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || !user) {
        window.location.href = '/login';
        return null;
    }
    return { token, user };
}

function initSidebar() {
    const auth = checkAuth();
    if (!auth) return;

    const { user } = auth;

    // عرض معلومات المستخدم
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRole');
    const initialsEl = document.getElementById('userInitials');

    if (nameEl) nameEl.textContent = user.full_name;
    if (roleEl) {
        const roleMap = {
            'admin': 'إداري',
            'teacher': 'معلم',
            'student': 'طالب',
            'parent': 'ولي أمر'
        };
        roleEl.textContent = roleMap[user.role] || user.role;
    }
    if (initialsEl) {
        // التحقق من وجود صورة
        if (user.avatar_url || user.profile_image) {
            const avatarUrl = user.avatar_url || user.profile_image;
            const parent = initialsEl.parentElement; // .user-avatar

            // تنظيف الحاوية
            parent.innerHTML = '';

            // إنشاء عنصر الصورة
            const img = document.createElement('img');
            img.src = avatarUrl;
            img.alt = user.full_name;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';

            parent.appendChild(img);
        } else {
            // عرض الأحرف الأولى إذا لم توجد صورة
            const initials = user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('');
            initialsEl.textContent = initials;
        }
    }

    // Inject 'Back to Home' Link to Sidebar
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav && !sidebarNav.querySelector('a[href="/"]')) {
        const homeLink = document.createElement('a');
        homeLink.href = '/';
        homeLink.className = 'nav-item';
        homeLink.innerHTML = '<span class="nav-icon">🏠</span><span class="nav-text">الرئيسية</span>';
        sidebarNav.insertBefore(homeLink, sidebarNav.firstChild);
    }

    // إضافة رابط الرسائل إذا لم يكن موجوداً (لغير الطلاب)
    if (sidebarNav && !sidebarNav.querySelector('a[href="/messages"]') && user.role !== 'student') {
        const logoutBtnItem = document.getElementById('logoutBtn');
        const messagesLink = document.createElement('a');
        messagesLink.href = '/messages';
        messagesLink.className = 'nav-item';
        messagesLink.innerHTML = '<span class="nav-icon">💬</span><span class="nav-text">الرسائل</span>';
        if (logoutBtnItem) {
            sidebarNav.insertBefore(messagesLink, logoutBtnItem);
        } else {
            sidebarNav.appendChild(messagesLink);
        }
    }

    // إخفاء جميع العناصر المخصصة للأدوار أولاً
    document.querySelectorAll('[class*="-only"]').forEach(el => el.style.display = 'none');

    // إظهار العناصر الخاصة بدور المستخدم الحالي
    const userRoleClass = `${user.role}-only`;
    document.querySelectorAll(`.${userRoleClass}`).forEach(el => {
        const displayType = (el.tagName === 'DIV' || el.tagName === 'SECTION' || el.tagName === 'HEADER') ? 'block' : 'flex';
        el.style.display = displayType;
    });

    // تفعيل زر تسجيل الخروج
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmed = await showLogoutConfirm();
        if (confirmed) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showToast('تم تسجيل الخروج بنجاح', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 800);
        }
    });

    // Toggle Sidebar Mobile
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('active');
    });
}

document.addEventListener('DOMContentLoaded', initSidebar);

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

    // Play subtle sound (optional, can be removed)
    // const audio = new Audio('/assets/sounds/notification.mp3'); 
    // audio.play().catch(e=>{}); 

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

// Global Custom Confirm Dialog
function showConfirm(message, title = 'تأكيد الإجراء', confirmText = 'نعم، احذف', cancelText = 'إلغاء') {
    return new Promise((resolve) => {
        if (document.querySelector('.custom-confirm-overlay')) return; // Prevent duplicates

        const overlay = document.createElement('div');
        overlay.className = 'custom-confirm-overlay';

        overlay.innerHTML = `
            <div class="custom-confirm-box">
                <div class="confirm-icon">⚠️</div>
                <h3 class="confirm-title">${title}</h3>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-btn-no" id="confirmCancel">${cancelText}</button>
                    <button class="confirm-btn confirm-btn-yes" id="confirmYes">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = (result) => {
            overlay.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => overlay.remove(), 200);
            resolve(result);
        };

        document.getElementById('confirmYes').addEventListener('click', () => close(true));
        document.getElementById('confirmCancel').addEventListener('click', () => close(false));

        // Close on clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });
    });
}

// Logout Confirmation Dialog - رسالة تأكيد الخروج
function showLogoutConfirm() {
    return new Promise((resolve) => {
        if (document.querySelector('.logout-confirm-overlay')) return; // Prevent duplicates

        const overlay = document.createElement('div');
        overlay.className = 'logout-confirm-overlay';

        overlay.innerHTML = `
            <div class="logout-confirm-box">
                <div class="logout-icon-container">
                    <div class="logout-icon">🚪</div>
                </div>
                <h3 class="logout-title">تأكيد تسجيل الخروج</h3>
                <p class="logout-message">هل أنت متأكد من رغبتك في تسجيل الخروج من النظام؟</p>
                <div class="logout-actions">
                    <button class="logout-btn logout-btn-cancel" id="logoutCancel">
                        <span>إلغاء</span>
                    </button>
                    <button class="logout-btn logout-btn-confirm" id="logoutConfirm">
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add animation class after a brief delay
        setTimeout(() => overlay.classList.add('active'), 10);

        const close = (result) => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            resolve(result);
        };

        document.getElementById('logoutConfirm').addEventListener('click', () => close(true));
        document.getElementById('logoutCancel').addEventListener('click', () => close(false));

        // Close on clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });

        // Close on ESC key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                close(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}
