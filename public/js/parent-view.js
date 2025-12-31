const API_URL = 'http://localhost:3000/api';

function getToken() {
    return localStorage.getItem('token');
}

async function loadChildren() {
    try {
        const response = await fetch(`${API_URL}/parents/my-children`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            displayChildren(data.data);
            // تحميل بيانات أول ابن تلقائياً
            loadStudentPerformance(data.data[0].student_id);
        } else {
            document.querySelector('.main-content').innerHTML = `
                <div class="alert alert-info mt-4" style="text-align:center">
                    لم يتم العثور على أبناء مرتبطين بحسابك. يرجى مراجعة إدارة المدرسة.
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayChildren(children) {
    const listContainer = document.getElementById('childrenList');
    if (!listContainer) return;

    listContainer.innerHTML = children.map((child, index) => `
        <div class="child-selector-card ${index === 0 ? 'active' : ''}" onclick="selectChild(this, ${child.student_id})">
            <div class="child-avatar">👨‍🎓</div>
            <div class="child-info">
                <h4>${child.full_name}</h4>
                <p>${child.class_name || 'غير محدد'}</p>
            </div>
        </div>
    `).join('');
}

window.selectChild = function (element, studentId) {
    document.querySelectorAll('.child-selector-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
    loadStudentPerformance(studentId);
};

async function loadStudentPerformance(studentId) {
    try {
        const response = await fetch(`${API_URL}/parents/performance/${studentId}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();

        if (data.success) {
            updateStats(data.data);
            updateGrades(data.data.grades);
            updateAttendance(data.data.attendance);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function updateStats(data) {
    // حساب المعدل العام من آخر الدرجات
    let avg = 0;
    if (data.grades.length > 0) {
        const sum = data.grades.reduce((acc, curr) => acc + (curr.grade / curr.max_grade), 0);
        avg = Math.round((sum / data.grades.length) * 100);
    }
    document.getElementById('avgGrade').textContent = avg + '%';

    // حساب نسبة الحضور من آخر 10 أيام
    let attendanceRate = 0;
    if (data.attendance.length > 0) {
        const presentCount = data.attendance.filter(a => a.status === 'present').length;
        attendanceRate = Math.round((presentCount / data.attendance.length) * 100);
    }
    document.getElementById('attendanceRate').textContent = attendanceRate + '%';

    // عدد المواد (الفريدة من الدرجات)
    const subjectsCount = new Set(data.grades.map(g => g.subject_name)).size;
    document.getElementById('subjectsCount').textContent = subjectsCount;
}

function updateGrades(grades) {
    const tbody = document.getElementById('gradesTableBody');
    if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد درجات مسجلة حالياً</td></tr>';
        return;
    }

    tbody.innerHTML = grades.map(g => {
        const percent = (g.grade / g.max_grade) * 100;
        let badgeClass = 'badge-danger';
        let badgeText = 'ضعيف';

        if (percent >= 90) { badgeClass = 'badge-success'; badgeText = 'ممتاز'; }
        else if (percent >= 80) { badgeClass = 'badge-primary'; badgeText = 'جيد جداً'; }
        else if (percent >= 70) { badgeClass = 'badge-primary'; badgeText = 'جيد'; }
        else if (percent >= 60) { badgeClass = 'badge-warning'; badgeText = 'مقبول'; }

        return `
            <tr>
                <td>${g.subject_name}</td>
                <td>${g.exam_name}</td>
                <td>${g.grade} / ${g.max_grade}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
            </tr>
        `;
    }).join('');
}

function updateAttendance(attendance) {
    const container = document.getElementById('attendanceHistory');
    if (attendance.length === 0) {
        container.innerHTML = '<p class="text-center p-3">لا يوجد سجل حضور حالياً</p>';
        return;
    }

    const statusMap = {
        'present': { text: 'حاضر', class: 'badge-success', color: '#10B981' },
        'absent': { text: 'غائب', class: 'badge-danger', color: '#EF4444' },
        'late': { text: 'متأخر', class: 'badge-warning', color: '#F59E0B' },
        'excused': { text: 'بعذر', class: 'badge-primary', color: '#3B82F6' }
    };

    container.innerHTML = attendance.map(a => {
        const status = statusMap[a.status] || { text: a.status, class: '', color: '#ccc' };
        return `
            <div style="padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); border-right: 4px solid ${status.color}; margin-bottom: 0.5rem;">
                <strong>${new Date(a.attendance_date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                <span class="badge ${status.class}" style="float: left;">${status.text}</span>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadChildren();
});
