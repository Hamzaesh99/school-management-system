// تحميل الإحصائيات
async function loadStats(token) {
    try {
        const response = await fetch(`${API_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            displayStats(data.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

function displayStats(stats) {
    const statsGrid = document.getElementById('statsGrid');
    const statCards = [
        { label: 'عدد الطلاب', value: stats.total_students || 0, icon: '👨‍🎓', color: 'linear-gradient(135deg, #4A90E2 0%, #3678C7 100%)' },
        { label: 'عدد المعلمين', value: stats.total_teachers || 0, icon: '👨‍🏫', color: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
        { label: 'عدد الصفوف', value: stats.total_classes || 0, icon: '🏫', color: 'linear-gradient(135deg, #FF8A5B 0%, #E67348 100%)' },
        { label: 'عدد المواد', value: stats.total_subjects || 0, icon: '📚', color: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }
    ];

    statsGrid.innerHTML = statCards.map(stat => `
        <div class="stat-card">
            <div class="stat-header">
                <div>
                    <div class="stat-value">${stat.value}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
                <div class="stat-icon" style="background: ${stat.color}">${stat.icon}</div>
            </div>
        </div>
    `).join('');
}

async function loadAnnouncements(token) {
    try {
        const response = await fetch(`${API_URL}/dashboard/recent-announcements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            const list = document.getElementById('announcementsList');
            if (data.data.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: var(--gray-500);">لا توجد إعلانات حالياً</p>';
                return;
            }

            // التحقق من صلاحية الحذف (إداري أو الناشر)
            // بما أننا في الواجهة، سنكتفي بالتحقق من الدور كإداري لعرض الزر مبدئياً لتسهيل الأمر
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const isAdmin = user.role === 'admin';

            list.innerHTML = data.data.map(ann => `
                <div class="announcement-item" style="position: relative;">
                    ${isAdmin ? `<button onclick="deleteAnnouncement(${ann.announcement_id})" class="delete-btn" style="position: absolute; left: 10px; top: 10px; background: none; border: none; color: #EF4444; cursor: pointer; font-size: 1.1rem;" title="حذف">🗑️</button>` : ''}
                    <h4 class="announcement-title">${ann.title}</h4>
                    <p class="announcement-content">${ann.content.substring(0, 100)}...</p>
                    <span class="announcement-date">${new Date(ann.publish_date).toLocaleDateString('ar-SA')}</span>
                </div>
            `).join('');
        }
    } catch (error) { console.error(error) }
}

async function deleteAnnouncement(id) {
    const confirmed = await showConfirm(
        'هل أنت متأكد من حذف هذا الإعلان نهائياً؟',
        'حذف الإعلان',
        'نعم، احذف',
        'إلغاء'
    );

    if (!confirmed) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/announcements/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (data.success) {
            showToast('تم حذف الإعلان بنجاح', 'success');
            loadAnnouncements(token);
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('حدث خطأ في الخادم', 'error');
    }
}

async function loadMessages(token) {
    try {
        const response = await fetch(`${API_URL}/dashboard/new-messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            const list = document.getElementById('messagesList');
            const navBadge = document.getElementById('notificationBadge');
            const dropDownList = document.getElementById('notificationList');

            // تحديث شارة التنبيهات
            if (navBadge) {
                navBadge.textContent = data.data.length;
                navBadge.style.display = data.data.length > 0 ? 'flex' : 'none';
            }

            // تحديث قائمة الرسائل في البطاقة
            if (list) {
                if (data.data.length === 0) {
                    list.innerHTML = '<p style="text-align: center; color: var(--gray-500); padding: 1rem;">لا توجد رسائل جديدة</p>';
                } else {
                    list.innerHTML = data.data.map(msg => `
                        <div class="message-item">
                            <h4 class="message-sender">${msg.sender_name}</h4>
                            <p class="message-preview">${msg.message_text.substring(0, 80)}${msg.message_text.length > 80 ? '...' : ''}</p>
                            <span class="message-date">${new Date(msg.sent_at).toLocaleString('ar-SA')}</span>
                        </div>
                    `).join('');
                }
            }

            // تحديث قائمة التنبيهات في الدروب داون
            if (dropDownList) {
                if (data.data.length === 0) {
                    dropDownList.innerHTML = '<p class="empty-msg">لا توجد تنبيهات جديدة</p>';
                } else {
                    dropDownList.innerHTML = data.data.map(msg => `
                        <div class="notification-item unread">
                            <div style="font-weight: 700;">${msg.sender_name}</div>
                            <div style="font-size: 0.85rem; color: var(--gray-600);">${msg.message_text.substring(0, 50)}...</div>
                            <div style="font-size: 0.75rem; color: var(--gray-400); margin-top: 0.25rem;">${new Date(msg.sent_at).toLocaleTimeString('ar-SA')}</div>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (auth) {
        loadStats(auth.token);
        loadAnnouncements(auth.token);
        loadMessages(auth.token);

        // تفعيل الدروب داون للتنبيهات
        const notifyBtn = document.getElementById('notificationBtn');
        const notifyDropdown = document.getElementById('notificationDropdown');

        if (notifyBtn && notifyDropdown) {
            notifyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notifyDropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                notifyDropdown.classList.remove('active');
            });

            notifyDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // تفعيل زر "تحديد كالمقروء" بشكل وهمي للآن
        document.getElementById('markReadBtn')?.addEventListener('click', () => {
            const badge = document.getElementById('notificationBadge');
            if (badge) badge.style.display = 'none';
            const list = document.getElementById('notificationList');
            if (list) list.innerHTML = '<p class="empty-msg">لا توجد تنبيهات جديدة</p>';
        });

        // Initialize Modals
        initModals(auth.token);
    }
});

// Modal Helpers
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize Modals and Forms
function initModals(token) {
    // Add Announcement
    const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
    if (addAnnouncementBtn) {
        // Show button only for admins (checked via class in HTML but valid ref via JS logic needed usually, 
        // strictly speaking we rely on the CSS 'admin-only' class being handled by common.js or similar if it exists, 
        // otherwise simply unhiding it if user is admin is needed. common.js handles this?)
        // Assuming common.js handles showing .admin-only based on role.
        // But common.js isn't shown, so we might need to manually check role from localStorage if common.js doesn't do it.
        // The user object is saved in localStorage usually. let's assume it works or force display: block if role is admin.
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.role === 'admin') {
                addAnnouncementBtn.style.display = 'inline-block';
            }
        } catch (e) { }

        addAnnouncementBtn.addEventListener('click', () => openModal('addAnnouncementModal'));
    }

    const addAnnouncementForm = document.getElementById('addAnnouncementForm');
    if (addAnnouncementForm) {
        addAnnouncementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'جاري النشر...';

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(`${API_URL}/announcements`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    showToast('تم نشر الإعلان بنجاح', 'success');
                    closeModal('addAnnouncementModal');
                    e.target.reset();
                    loadAnnouncements(token);
                } else {
                    showToast('خطأ: ' + result.message, 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('حدث خطأ في الاتصال', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'نشر الإعلان';
            }
        });
    }

    // Send Message
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', async () => {
            openModal('sendMessageModal');
            // Load recipients if not loaded
            const select = document.getElementById('msgReceiverSelect');
            if (select && select.options.length <= 1) {
                try {
                    const response = await fetch(`${API_URL}/messages/recipients`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (result.success) {
                        select.innerHTML = '<option value="">اختر المستلم...</option>' +
                            result.data.map(u => `<option value="${u.user_id}">${u.full_name} (${u.role})</option>`).join('');
                    }
                } catch (error) {
                    console.error(error);
                    select.innerHTML = '<option value="">فشل التحميل</option>';
                }
            }
        });
    }

    const sendMessageForm = document.getElementById('sendMessageForm');
    if (sendMessageForm) {
        sendMessageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'جاري الإرسال...';

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(`${API_URL}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    showToast('تم إرسال الرسالة بنجاح', 'success');
                    closeModal('sendMessageModal');
                    e.target.reset();
                    loadMessages(token); // Not strictly "new messages" for *us* usually, but good to refresh context
                } else {
                    showToast('خطأ: ' + result.message, 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('حدث خطأ في الاتصال', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'إرسال';
            }
        });
    }

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}
