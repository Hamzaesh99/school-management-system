let allClasses = [];
let currentStudents = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterDate').value = today;
    document.getElementById('modalDate').value = today;

    await loadClasses();

    // Event Listeners
    document.getElementById('filterBtn').addEventListener('click', loadAttendanceRecords);

    document.getElementById('openAttendanceModalBtn').addEventListener('click', () => {
        document.getElementById('attendanceModal').classList.add('active');
    });

    document.getElementById('closeAttendanceModal').addEventListener('click', () => {
        document.getElementById('attendanceModal').classList.remove('active');
    });

    document.getElementById('modalClass').addEventListener('change', (e) => {
        loadSubjects(e.target.value);
    });

    document.getElementById('loadStudentsBtn').addEventListener('click', loadStudentsForAttendance);

    document.getElementById('saveAttendanceBtn').addEventListener('click', saveAttendance);

    // Permission Check
    const auth = checkAuth();
    if (auth && !['admin', 'teacher', 'student'].includes(auth.user.role)) {
        const btn = document.getElementById('openAttendanceModalBtn');
        if (btn) btn.style.display = 'none';
    }

    // PDF Export
    document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);

    // Initial load
    loadAttendanceRecords();
});

function exportPDF() {
    const element = document.querySelector('.card'); // Export the whole card including title
    const opt = {
        margin: [10, 10],
        filename: `attendance_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Show toast
    showToast('جاري تحضير ملف PDF...', 'info');

    html2pdf().set(opt).from(element).save().then(() => {
        showToast('تم تحميل ملف PDF بنجاح', 'success');
    });
}


async function loadClasses() {
    const auth = checkAuth();
    if (!auth) return;

    try {
        const response = await fetch(`${API_URL}/classes`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();

        if (data.success) {
            allClasses = data.data;

            // PARENT FILTER: Only show classes of their children
            if (auth.user.role === 'parent') {
                try {
                    const childRes = await fetch(`${API_URL}/parents/my-children`, {
                        headers: { 'Authorization': `Bearer ${auth.token}` }
                    });
                    const childData = await childRes.json();
                    if (childData.success && childData.data.length > 0) {
                        const childClassIds = childData.data.map(c => c.class_id);
                        allClasses = allClasses.filter(c => childClassIds.includes(c.class_id));
                    } else {
                        allClasses = []; // No children found or assigned to classes
                    }
                } catch (e) {
                    console.error('Error fetching children classes:', e);
                }
            }

            // STUDENT FILTER: Only show their assigned class
            if (auth.user.role === 'student') {
                try {
                    const studentListRes = await fetch(`${API_URL}/students`, {
                        headers: { 'Authorization': `Bearer ${auth.token}` }
                    });
                    const startData = await studentListRes.json();
                    if (startData.success) {
                        const myStudentProfile = startData.data.find(s => s.user_id === auth.user.user_id);
                        if (myStudentProfile && myStudentProfile.class_id) {
                            allClasses = allClasses.filter(c => c.class_id === myStudentProfile.class_id);
                        } else {
                            allClasses = [];
                        }
                    }
                } catch (e) { console.error('Error filtering student class', e); }
            }

            const filterClassSelect = document.getElementById('filterClass');
            const modalClassSelect = document.getElementById('modalClass');

            const options = allClasses.map(c =>
                `<option value="${c.class_id}">${c.class_name}</option>`
            ).join('');

            filterClassSelect.innerHTML = '<option value="">كل الصفوف</option>' + options;
            modalClassSelect.innerHTML = '<option value="">اختر الصف...</option>' + options;
        }
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function loadSubjects(classId) {
    if (!classId) return;

    const auth = checkAuth();
    try {
        const response = await fetch(`${API_URL}/classes/subjects?class_id=${classId}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();

        const subjectSelect = document.getElementById('modalSubject');
        if (data.success && data.data.length > 0) {
            subjectSelect.innerHTML = '<option value="">اختر المادة...</option>' +
                data.data.map(s => `<option value="${s.subject_id}">${s.subject_name}</option>`).join('');
        } else {
            // Fallback if no subjects assigned yet, fetch all subjects
            const allSubRes = await fetch(`${API_URL}/subjects`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            const allSubData = await allSubRes.json();
            if (allSubData.success) {
                subjectSelect.innerHTML = '<option value="">اختر المادة...</option>' +
                    allSubData.data.map(s => `<option value="${s.subject_id}">${s.subject_name}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

async function loadStudentsForAttendance() {
    const classId = document.getElementById('modalClass').value;
    const subjectId = document.getElementById('modalSubject').value;
    const date = document.getElementById('modalDate').value;

    if (!classId || !subjectId || !date) {
        showToast('يرجى اختيار الصف والمادة والتاريخ', 'warning');
        return;
    }

    const auth = checkAuth();
    try {
        const response = await fetch(`${API_URL}/students?class_id=${classId}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();

        if (data.success) {
            currentStudents = data.data;

            // STUDENT FILTER: Only show themselves in the list
            if (auth.user.role === 'student') {
                const studentListRes = await fetch(`${API_URL}/students`, {
                    headers: { 'Authorization': `Bearer ${auth.token}` }
                });
                const startData = await studentListRes.json();
                if (startData.success) {
                    const myStudentProfile = startData.data.find(s => s.user_id === auth.user.user_id);
                    if (myStudentProfile) {
                        currentStudents = currentStudents.filter(s => s.student_id === myStudentProfile.student_id);
                    } else {
                        currentStudents = [];
                    }
                }
            }

            displayStudentList(currentStudents);
            document.getElementById('saveAttendanceBtn').disabled = false;
        } else {
            document.getElementById('studentsList').innerHTML = '<div class="text-center p-3">لا يوجد طلاب في هذا الصف</div>';
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('حدث خطأ في جلب الطلاب', 'error');
    }
}

function displayStudentList(students) {
    const listContainer = document.getElementById('studentsList');

    if (students.length === 0) {
        listContainer.innerHTML = '<div class="text-center p-3">لا يوجد طلاب</div>';
        return;
    }

    const html = students.map(student => `
        <div class="student-row" data-id="${student.student_id}">
            <div class="student-info">
                <strong>${student.full_name}</strong>
            </div>
            <div class="attendance-actions">
                <button type="button" class="status-btn status-present active" onclick="setStatus(this, 'present')">حاضر</button>
                <button type="button" class="status-btn status-absent" onclick="setStatus(this, 'absent')">غائب</button>
                <button type="button" class="status-btn status-late" onclick="setStatus(this, 'late')">متأخر</button>
                <button type="button" class="status-btn status-excused" onclick="setStatus(this, 'excused')">معذور</button>
            </div>
            <div class="student-notes">
                <input type="text" class="form-control note-input" placeholder="ملاحظات..." style="font-size: 0.85rem;">
            </div>
        </div>
    `).join('');

    listContainer.innerHTML = html;
}

window.setStatus = function (btn, status) {
    const row = btn.closest('.student-row');
    row.querySelectorAll('.status-btn.active').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    row.dataset.status = status;
}

async function saveAttendance() {
    const classId = document.getElementById('modalClass').value;
    const subjectId = document.getElementById('modalSubject').value;
    const date = document.getElementById('modalDate').value;
    const rows = document.querySelectorAll('.student-row');
    const auth = checkAuth();

    let successCount = 0;
    let failCount = 0;

    showToast('جاري حفظ البيانات...', 'info');
    document.getElementById('saveAttendanceBtn').disabled = true;

    const promises = Array.from(rows).map(async (row) => {
        const studentId = row.dataset.id;

        let status = 'present';
        const activeBtn = row.querySelector('.status-btn.active');
        if (activeBtn) {
            if (activeBtn.classList.contains('status-absent')) status = 'absent';
            if (activeBtn.classList.contains('status-late')) status = 'late';
            if (activeBtn.classList.contains('status-excused')) status = 'excused';
        }

        const notes = row.querySelector('.note-input').value;

        try {
            const response = await fetch(`${API_URL}/attendance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: studentId,
                    class_id: classId,
                    subject_id: subjectId,
                    attendance_date: date,
                    status: status,
                    notes: notes
                })
            });
            const data = await response.json();
            if (data.success) return true;
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    });

    const results = await Promise.all(promises);
    successCount = results.filter(r => r === true).length;
    failCount = results.filter(r => r === false).length;

    document.getElementById('saveAttendanceBtn').disabled = false;

    if (failCount === 0) {
        showToast('تم حفظ حضور جميع الطلاب بنجاح', 'success');
        document.getElementById('attendanceModal').classList.remove('active');
        loadAttendanceRecords();
    } else {
        showToast(`تم الحفظ: ${successCount}، فشل: ${failCount}`, 'warning');
    }
}

async function loadAttendanceRecords() {
    const classId = document.getElementById('filterClass').value;
    const date = document.getElementById('filterDate').value;

    if (!date) return;

    const auth = checkAuth();
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">جاري التحميل...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/attendance?class_id=${classId}&date=${date}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            let displayData = data.data;

            // PARENT FILTER: Show only their children
            if (auth.user.role === 'parent') {
                try {
                    const childRes = await fetch(`${API_URL}/parents/my-children`, {
                        headers: { 'Authorization': `Bearer ${auth.token}` }
                    });
                    const childData = await childRes.json();
                    if (childData.success && childData.data.length > 0) {
                        const myChildIds = childData.data.map(c => c.student_id);
                        displayData = displayData.filter(r => myChildIds.includes(r.student_id));
                    } else {
                        displayData = [];
                    }
                } catch (e) { console.error(e); displayData = []; }
            }

            // STUDENT FILTER: Show only their own records
            if (auth.user.role === 'student') {
                // Since user_id is in auth.user.user_id, we need to find student_id or filter by user association.
                // The attendance record probably contains student info, but we need to match it to *this* user.
                // The safest way without extra calls is if the attendance data has user_id or we match name if unique... 
                // Better: fetch student profile first to get student_id.
                try {
                    const studentListRes = await fetch(`${API_URL}/students`, {
                        headers: { 'Authorization': `Bearer ${auth.token}` }
                    });
                    const startData = await studentListRes.json();
                    if (startData.success) {
                        const myStudentProfile = startData.data.find(s => s.user_id === auth.user.user_id);
                        if (myStudentProfile) {
                            displayData = displayData.filter(r => r.student_id === myStudentProfile.student_id);
                        } else {
                            displayData = [];
                        }
                    }
                } catch (e) { console.error(e); displayData = []; }
            }

            if (displayData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">لا توجد سجلات مطابقة في هذا التاريخ</td></tr>';
                return;
            }

            const statusMap = {
                'present': '<span class="badge badge-success" style="background:#d1fae5; color:#065f46; padding:4px 8px; border-radius:4px;">حاضر</span>',
                'absent': '<span class="badge badge-danger" style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:4px;">غائب</span>',
                'late': '<span class="badge badge-warning" style="background:#fef3c7; color:#92400e; padding:4px 8px; border-radius:4px;">متأخر</span>',
                'excused': '<span class="badge badge-primary" style="background:#dbeafe; color:#1e40af; padding:4px 8px; border-radius:4px;">معذور</span>'
            };

            tbody.innerHTML = displayData.map(r => `
                <tr>
                    <td>${r.student_name}</td>
                    <td>${r.class_name || '-'}</td>
                    <td>${r.subject_name || '-'}</td>
                    <td>${r.attendance_date.split('T')[0]}</td>
                    <td>${statusMap[r.status] || r.status}</td>
                    <td>${r.recorded_by_name || '-'}</td>
                    <td>${r.notes || '-'}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">لا توجد سجلات لهذا اليوم</td></tr>';
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color:red;">حدث خطأ في تحميل البيانات</td></tr>';
    }
}
