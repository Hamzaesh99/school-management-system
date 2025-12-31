
// Messages Page Logic

let allMessages = [];
let currentMessageId = null;

document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (!auth) return;

    loadAllMessages(auth.token);
    initComposeModal(auth.token);

    // Back to list button (mobile)
    const backBtn = document.getElementById('backToList');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('messageContentArea').classList.remove('mobile-active');
        });
    }
});

async function loadAllMessages(token) {
    try {
        // We'll use the same endpoint as dashboard but asking for more messages or a dedicated endpoint?
        // Currently we used /api/dashboard/new-messages which gives top 5.
        // We probably need a dedicated endpoint like /api/messages/inbox?
        // Let's assume we can add a simple GET /api/messages/inbox route or just reuse the logic.
        // Wait, I didn't create GET /api/messages/inbox in the backend. 
        // I created POST / and GET /recipients.
        // I should stick to what works or assume I'll fix the backend next.
        // Let's try to fetch from a new endpoint I WILL create: GET /api/messages

        const response = await fetch(`${API_URL}/messages/inbox`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        let messages = [];
        if (response.ok) {
            const json = await response.json();
            if (json.success) messages = json.data;
        } else {
            console.error('Failed to load messages');
        }

        allMessages = messages;
        renderMessagesList(messages);

    } catch (error) {
        console.error('Error loading messages:', error);
        document.getElementById('messagesListContainer').innerHTML = '<p class="text-center p-4">خطأ في تحميل الرسائل</p>';
    }
}

function renderMessagesList(messages) {
    const listContainer = document.getElementById('messagesListContainer');
    if (messages.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--gray-500);">لا توجد رسائل في صندوق الوارد</p>';
        return;
    }

    listContainer.innerHTML = messages.map((msg, index) => `
        <div class="message-list-item ${msg.is_read ? '' : 'unread'} ${currentMessageId === msg.message_id ? 'active' : ''}" 
             onclick="viewMessage(${msg.message_id})" 
             style="animation: slideInRight 0.3s ease ${index * 0.05}s backwards;">
            <div class="msg-preview-sender">
                <span>${msg.sender_name}</span>
                ${!msg.is_read ? '<span style="width:8px;height:8px;background:var(--primary-green);border-radius:50%;"></span>' : ''}
            </div>
            <div class="msg-preview-subject">${msg.subject || 'بدون عنوان'}</div>
            <div class="msg-preview-text">${msg.message_text.substring(0, 60)}${msg.message_text.length > 60 ? '...' : ''}</div>
            <div class="msg-preview-date">${formatMessageDate(msg.sent_at)}</div>
        </div>
    `).join('');
}

// Helper function to format date in a friendly way
function formatMessageDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return minutes === 0 ? 'الآن' : `منذ ${minutes} دقيقة`;
        }
        return `منذ ${hours} ساعة`;
    } else if (days === 1) {
        return 'أمس';
    } else if (days < 7) {
        return `منذ ${days} أيام`;
    }
    return date.toLocaleDateString('ar-SA');
}

function viewMessage(id) {
    const msg = allMessages.find(m => m.message_id == id);
    if (!msg) return;

    currentMessageId = id;

    // Show content area
    const contentArea = document.getElementById('messageContentArea');
    const emptyState = document.getElementById('emptyState');
    const viewMessage = document.getElementById('viewMessage');

    emptyState.style.display = 'none';
    viewMessage.classList.add('active');

    // For mobile
    contentArea.classList.add('mobile-active');

    // Populate data
    document.getElementById('msgSubject').textContent = msg.subject;
    document.getElementById('msgSenderName').textContent = msg.sender_name;
    document.getElementById('msgDate').textContent = new Date(msg.sent_at).toLocaleString('ar-SA');
    document.getElementById('msgBody').textContent = msg.message_text;
    document.getElementById('msgSenderAvatar').textContent = msg.sender_name.charAt(0);

    // Setup Reply Button
    document.getElementById('replyBtn').onclick = () => {
        openComposeModalForReply(msg);
    };

    // Mark as read if needed
    if (!msg.is_read) {
        markMessageAsRead(id);
        msg.is_read = true; // Update local state immediately for UI
        renderMessagesList(allMessages); // Update list UI

        // Update global notification badge if present
        updateGlobalBadgeCount();
    }
}

async function markMessageAsRead(messageId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch(`${API_URL}/messages/${messageId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

function updateGlobalBadgeCount() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        let count = parseInt(badge.textContent) || 0;
        if (count > 0) {
            count--;
            badge.textContent = count;
            if (count === 0) badge.style.display = 'none';
        }
    }
}

function initComposeModal(token) {
    const composeBtn = document.getElementById('composeBtn');
    composeBtn.addEventListener('click', () => {
        document.getElementById('sendMessageForm').reset();
        loadRecipients(token);
        openModal('sendMessageModal');
    });

    const form = document.getElementById('sendMessageForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'جاري الإرسال...';

        const formData = new FormData(form);
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
                showToast('تم الإرسال بنجاح', 'success');
                closeModal('sendMessageModal');
                loadAllMessages(token); // Refresh list (though sent messages logic isn't fully separate here yet)
            } else {
                showToast(result.message, 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('خطأ في الإرسال', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'إرسال';
        }
    });
}

function openComposeModalForReply(msg) {
    // Open modal
    openModal('sendMessageModal');

    // Pre-fill recipients
    const token = checkAuth().token;
    loadRecipients(token, msg.sender_id);

    // Pre-fill subject
    const subjectField = document.querySelector('input[name="subject"]');
    if (subjectField) {
        subjectField.value = `رد: ${msg.subject}`;
    }
}

async function loadRecipients(token, selectedId = null) {
    const select = document.getElementById('msgReceiverSelect');
    if (select.options.length > 1 && !selectedId) return; // already loaded

    try {
        const response = await fetch(`${API_URL}/messages/recipients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
            select.innerHTML = '<option value="">اختر المستلم...</option>' +
                result.data.map(u => `<option value="${u.user_id}" ${u.user_id == selectedId ? 'selected' : ''}>${u.full_name} (${u.role})</option>`).join('');
        }
    } catch (e) { console.error(e); }
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
