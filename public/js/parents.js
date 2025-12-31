let allParents = [];

async function loadParents() {
    const auth = checkAuth();
    if (!auth) return;

    try {
        const response = await fetch(`${API_URL}/parents`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();
        if (data.success) {
            allParents = data.data;
            displayParents(allParents);
        }
    } catch (error) {
        console.error('Error loading parents:', error);
    }
}

function displayParents(parents) {
    const tbody = document.getElementById('parentsTableBody');
    if (!tbody) return;

    if (parents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد بيانات</td></tr>';
        return;
    }

    const auth = checkAuth();
    const isStudent = auth && auth.user.role === 'student';

    tbody.innerHTML = parents.map(parent => `
        <tr>
            <td>${parent.full_name}</td>
            <td>${parent.phone || '-'}</td>
            <td>${parent.email}</td>
            <td title="${parent.children_names || ''}">
                <span class="badge ${parent.children_count > 0 ? 'badge-primary' : 'badge-gray'}">
                    ${parent.children_count || 0}
                </span>
                ${parent.children_names ? `<div style="font-size: 0.8rem; color: #666; margin-top: 4px;">${parent.children_names}</div>` : ''}
            </td>
            <td>
                ${!isStudent ? `
                <div class="action-btns">
                    <button class="btn btn-sm btn-edit" style="background-color: #2563eb; color: white;" onclick="openEditParentModal(${parent.user_id})">تعديل</button>
                    <button class="btn btn-sm" style="background-color: #10b981; color: white;" onclick="viewChildren(${parent.user_id})">الأبناء</button>
                    <button class="btn btn-delete btn-sm" onclick="showToast('لحذف ولي الأمر، يرجى استخدام إدارة المستخدمين', 'info')">حذف</button>
                </div>` : '<span class="text-muted" style="color: gray;">عرض فقط</span>'}
            </td>
        </tr>
    `).join('');
}

async function viewChildren(parentId) {
    const auth = checkAuth();
    try {
        const response = await fetch(`${API_URL}/parents/${parentId}/children`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();
        if (data.success) {
            if (data.data.length === 0) {
                showToast('لا يوجد أبناء مسجلين لهذا الولي', 'info');
            } else {
                const childrenNames = data.data.map(c => `• ${c.full_name} (${c.class_name || 'غير محدد'})`).join('<br>');
                showConfirm(
                    `<strong>قائمة الأبناء:</strong><br><div style="text-align: right; margin-top: 10px;">${childrenNames}</div>`,
                    'أبناء ولي الأمر',
                    'إغلاق',
                    'إغلاق'
                );
            }
        }
    } catch (error) {
        console.error(error);
        showToast('خطأ في جلب البيانات', 'error');
    }
}

function openEditParentModal(parentId) {
    const parent = allParents.find(p => p.user_id === parentId);
    if (!parent) return;

    document.getElementById('editParentId').value = parent.user_id;
    document.getElementById('editFullName').value = parent.full_name;
    document.getElementById('editPhone').value = parent.phone || '';
    document.getElementById('editEmail').value = parent.email || '';
    document.getElementById('editAddress').value = parent.address || '';

    document.getElementById('editParentModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editParentModal').classList.remove('active');
}

document.getElementById('editParentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const auth = checkAuth();
    const id = document.getElementById('editParentId').value;

    const payload = {
        full_name: document.getElementById('editFullName').value,
        phone: document.getElementById('editPhone').value,
        email: document.getElementById('editEmail').value,
        address: document.getElementById('editAddress').value
    };

    try {
        // Updating user profile since parents are users
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${auth.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.success) {
            showToast('تم تحديث بيانات ولي الأمر بنجاح', 'success');
            closeEditModal();
            loadParents();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('حدث خطأ أثناء التحديث', 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadParents();

    const auth = checkAuth();
    const addBtn = document.getElementById('addParentBtn');

    // Hide for students
    if (auth && auth.user.role === 'student') {
        if (addBtn) addBtn.style.display = 'none';
    }
    else if (addBtn) {
        addBtn.addEventListener('click', () => {
            showToast('إدارة أولياء الأمور تتم عبر "إدارة المستخدمين"', 'info');
            setTimeout(() => window.location.href = '/users-management', 1500);
        });
    }
});

// Expose functions globally
window.viewChildren = viewChildren;
window.openEditParentModal = openEditParentModal;
window.closeEditModal = closeEditModal;
