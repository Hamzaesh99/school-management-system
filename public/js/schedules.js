
let allClasses = [];
let allSchedules = [];
let allTeachers = []; // Added
let currentClassId = null;
let currentYear = '2024-2025';
let currentSemester = 'first';

// ... (Time Slots and Days remain same) ...

async function loadTeachers() { // New function
    const auth = checkAuth();
    if (!auth) return;
    try {
        const response = await fetch(`${API_URL}/teachers`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();
        if (data.success) {
            allTeachers = data.data;
            const select = document.getElementById('scheduleTeacher');
            const options = allTeachers.map(t =>
                `<option value="${t.teacher_id}">${t.full_name}</option>`
            ).join('');
            select.innerHTML = '<option value="">-- اختر المعلم --</option>' + options;
        }
    } catch (e) { console.error('Error loading teachers', e); }
}

async function loadSubjectsForClass(classId) {
    const auth = checkAuth();
    if (!auth || !classId) return;

    try {
        const response = await fetch(`${API_URL}/classes/subjects?class_id=${classId}&academic_year=${currentYear}&semester=${currentSemester}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });

        const data = await response.json();
        const select = document.getElementById('scheduleSubject');

        if (data.success && data.data.length > 0) {
            select.innerHTML = '<option value="">اختر المادة...</option>' +
                data.data.map(cs =>
                    `<option value="${cs.class_subject_id}" data-teacher-user-id="${cs.teacher_id || ''}">${cs.subject_name} ${cs.teacher_name ? '- ' + cs.teacher_name : ''}</option>`
                ).join('');
        } else {
            const allSubjectsResponse = await fetch(`${API_URL}/subjects`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            const allSubjectsData = await allSubjectsResponse.json();

            if (allSubjectsData.success) {
                select.innerHTML = '<option value="">اختر المادة...</option>' +
                    allSubjectsData.data.map(s =>
                        `<option value="new_${s.subject_id}">${s.subject_name} (إنشاء تخصيص جديد)</option>`
                    ).join('');
            } else {
                select.innerHTML = '<option value="">لا توجد مواد متاحة</option>';
            }
        }
    } catch (error) {
        console.error('خطأ:', error);
        document.getElementById('scheduleSubject').innerHTML = '<option value="">حدث خطأ في التحميل</option>';
    }
}

// ... (openScheduleModal remains mostly same) ...

function editSchedule(scheduleId) {
    const schedule = allSchedules.find(s => s.schedule_id === scheduleId);
    if (!schedule) return;

    const modal = document.getElementById('scheduleModal');
    const title = document.getElementById('scheduleModalTitle');

    title.textContent = 'تعديل الحصة الدراسية';

    document.getElementById('scheduleId').value = schedule.schedule_id;
    document.getElementById('scheduleClass').value = schedule.class_id;
    // We trigger loadSubjectsForClass then set values
    // Using simple approach: wait for promise? No, distinct function call.
    // We'll set values after calling loadSubjectsForClass.
    // However, loading is async. We might need to wait.

    // Better approach:
    const subjectSelect = document.getElementById('scheduleSubject');
    // Pre-set DOM elements immediately? No, options need to load.

    loadSubjectsForClass(schedule.class_id).then(() => {
        document.getElementById('scheduleSubject').value = schedule.class_subject_id;

        // Set Teacher
        // Map schedule.teacher_user_id (User ID) to Teacher ID
        const teacher = allTeachers.find(t => t.user_id === schedule.teacher_user_id);
        if (teacher) {
            document.getElementById('scheduleTeacher').value = teacher.teacher_id;
        } else {
            document.getElementById('scheduleTeacher').value = "";
        }
    });

    document.getElementById('scheduleDay').value = schedule.day_of_week;
    document.getElementById('startTime').value = schedule.start_time.substring(0, 5);
    document.getElementById('endTime').value = schedule.end_time.substring(0, 5);
    document.getElementById('roomNumber').value = schedule.room_number || '';

    modal.classList.add('active');
}

// ... (deleteSchedule remains same) ...

// Event Listeners ...

document.getElementById('scheduleSubject').addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const teacherUserId = selectedOption.getAttribute('data-teacher-user-id');
    const teacherSelect = document.getElementById('scheduleTeacher');

    if (teacherUserId) {
        const teacher = allTeachers.find(t => t.user_id == teacherUserId);
        if (teacher) teacherSelect.value = teacher.teacher_id;
        else teacherSelect.value = "";
    } else {
        // New or undefined, let user pick
        // If it was "New", maybe reset?
        // Keep as it is (user intent)
    }
});

document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const auth = checkAuth();
    const id = document.getElementById('scheduleId').value;
    const isEdit = !!id;

    let subjectValue = document.getElementById('scheduleSubject').value;
    const classId = document.getElementById('scheduleClass').value;
    const teacherId = document.getElementById('scheduleTeacher').value; // Get selected teacher

    // Always ensure Class-Subject connection is correct/updated with this teacher
    let subjectId = null;
    let needsAssignmentUpdate = false;

    if (subjectValue.startsWith('new_')) {
        subjectId = subjectValue.replace('new_', '');
        needsAssignmentUpdate = true;
    } else {
        // It's an existing class_subject_id.
        // We want to update the teacher for this class_subject if it changed.
        // But we don't know the pure subject_id from here easily without looking up.
        // We can get class_subject_id check? 
        // Logic: Just send POST assignments with the teacher_id to UPSERT it?
        // But POST assignments requires `subject_id` (raw) not `class_subject_id`.

        // Trick: If we are only updating the schedule, and we didn't change assignment...
        // But the USER wants to fix "Undefined Teacher".
        // They selected a teacher. We MUST update the assignment.
        // How to get `subject_id` from `class_subject_id`?
        // `loadSubjectsForClass` didn't store raw `subject_id` in value.

        // We should probably fetch it or store it in dataset.
        // Let's assume we can get it from the selected option dataset?
        // I need to update `loadSubjectsForClass` to store `data-subject-id`.
    }

    // REVISIT loadSubjectsForClass to add data-subject-id
    const selectedOption = document.getElementById('scheduleSubject').options[document.getElementById('scheduleSubject').selectedIndex];
    // If new_, subjectId is derived.
    // If existing, we need to know subject_id to call assignSubjectToClass.

    // If I can't get subject_id easily for existing, I can't call assignSubjectToClass easily.
    // ALTERNATIVE: Backend `updateScheduleEntry` could theoretically update the class_subject, but that's messy.

    // I will add data-subject-id to `loadSubjectsForClass`.
});


// Time slots - increased to 8 periods
const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' }, // Break
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' }
];

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const dayNames = {
    'Sunday': 'الأحد',
    'Monday': 'الإثنين',
    'Tuesday': 'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس'
};

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

            // If user is parent, filter classes to only those of their children
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

            // If user is student, filter classes to only their own class
            if (auth.user.role === 'student') {
                try {
                    const profileRes = await fetch(`${API_URL}/auth/me`, { // Or similar endpoint to get detailed profile including class_id
                        headers: { 'Authorization': `Bearer ${auth.token}` }
                    });
                    // Assuming we can get class_id from user object or a specific student endpoint. 
                    // Often 'user' in localStorage might not have class_id if it's generic user data.
                    // Let's try to fetch student details.
                    const studentRes = await fetch(`${API_URL}/students/me`, { // Hypothetical endpoint, or reuse profiles
                        headers: { 'Authorization': `Bearer ${auth.token}` }
                    });

                    // Validating if such endpoint exists is hard without checking routes.
                    // Alternative: Search student list for this user.
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

            populateClassSelect();
        }
    } catch (error) {
        console.error('خطأ:', error);
    }
}

function populateClassSelect() {
    const select = document.getElementById('classSelect');
    const modalSelect = document.getElementById('scheduleClass');

    const options = allClasses.map(cls =>
        `<option value="${cls.class_id}">${cls.class_name} - المستوى ${cls.grade_level}</option>`
    ).join('');

    select.innerHTML = '<option value="">اختر الصف الدراسي...</option>' + options;
    modalSelect.innerHTML = '<option value="">اختر الصف...</option>' + options;

    // Check auth for button visibility
    const auth = checkAuth();
    const canEdit = auth && (auth.user.role === 'admin' || auth.user.role === 'teacher');
    const createBtn = document.getElementById('createScheduleBtn');
    if (createBtn) createBtn.style.display = canEdit ? 'block' : 'none';
}

async function loadSchedules(classId, year, semester) {
    const auth = checkAuth();
    if (!auth || !classId) return;

    try {
        const response = await fetch(`${API_URL}/schedules?class_id=${classId}&academic_year=${year}&semester=${semester}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });

        const data = await response.json();
        if (data.success) {
            allSchedules = data.data;
            displaySchedule();
        }
    } catch (error) {
        console.error('خطأ:', error);
    }
}

function displaySchedule() {
    const tbody = document.getElementById('scheduleTableBody');
    const auth = checkAuth();
    const canEdit = auth && (auth.user.role === 'admin' || auth.user.role === 'teacher');
    const isRestricted = !canEdit;

    if (!currentClassId) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <p style="font-size: 1.1rem; color: var(--gray-600);">
                        📅 اختر صفاً دراسياً لعرض جدوله
                    </p>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';

    timeSlots.forEach((slot, index) => {
        if (index === 2) {
            // Break time
            html += `
                <tr>
                    <td>${slot.start} - ${slot.end}</td>
                    <td colspan="5" style="text-align: center; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); font-weight: 700; padding: 1rem;">
                        ☕ استراحة
                    </td>
                </tr>
            `;
        } else {
            html += `<tr><td>${slot.start} - ${slot.end}</td>`;

            days.forEach(day => {
                const schedule = allSchedules.find(s =>
                    s.day_of_week === day &&
                    s.start_time === slot.start + ':00'
                );

                if (schedule) {
                    html += `
                        <td>
                            <div class="schedule-cell has-class">
                                ${!isRestricted ? `
                                <div class="schedule-actions">
                                    <button class="action-btn edit" onclick="editSchedule(${schedule.schedule_id}); event.stopPropagation();" title="تعديل">✏️</button>
                                    <button class="action-btn delete" onclick="deleteSchedule(${schedule.schedule_id}); event.stopPropagation();" title="حذف">🗑️</button>
                                </div>` : ''}
                                <div ${!isRestricted ? `onclick="editSchedule(${schedule.schedule_id})"` : ''}>
                                    <div class="subject-name">${schedule.subject_name || 'غير محدد'}</div>
                                    <div class="teacher-name">👨‍🏫 ${schedule.teacher_name || 'غير محدد'}</div>
                                    ${schedule.room_number ? `<div class="room-name">🚪 ${schedule.room_number}</div>` : ''}
                                </div>
                            </div>
                        </td>
                    `;
                } else {
                    html += `
                        <td>
                            ${!isRestricted ? `
                            <div class="schedule-cell empty-cell" onclick="openScheduleModal('${day}', '${slot.start}', '${slot.end}')">
                                <div class="add-icon">➕</div>
                                <div class="add-text">إضافة حصة</div>
                            </div>` : '<div class="schedule-cell empty-cell" style="cursor: default; background: #f9fafb;"></div>'}
                        </td>
                    `;
                }
            });

            html += `</tr>`;
        }
    });

    tbody.innerHTML = html;
}

async function loadSubjectsForClass(classId) {
    const auth = checkAuth();
    if (!auth || !classId) return;

    try {
        // Try to get subjects assigned to this class first
        const response = await fetch(`${API_URL}/classes/subjects?class_id=${classId}&academic_year=${currentYear}&semester=${currentSemester}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });

        const data = await response.json();
        const select = document.getElementById('scheduleSubject');

        if (data.success && data.data.length > 0) {
            // Use assigned subjects
            select.innerHTML = '<option value="">اختر المادة...</option>' +
                data.data.map(cs =>
                    `<option value="${cs.class_subject_id}" data-subject-id="${cs.subject_id}" data-teacher-user-id="${cs.teacher_id || ''}">${cs.subject_name} ${cs.teacher_name ? '- ' + cs.teacher_name : ''}</option>`
                ).join('');
        } else {
            // Fallback: Load all subjects
            const allSubjectsResponse = await fetch(`${API_URL}/subjects`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            const allSubjectsData = await allSubjectsResponse.json();

            if (allSubjectsData.success) {
                select.innerHTML = '<option value="">اختر المادة...</option>' +
                    allSubjectsData.data.map(s =>
                        `<option value="new_${s.subject_id}">${s.subject_name} (سيتم إنشاء تخصيص جديد)</option>`
                    ).join('');
            } else {
                select.innerHTML = '<option value="">لا توجد مواد متاحة</option>';
            }
        }
    } catch (error) {
        console.error('خطأ:', error);
        document.getElementById('scheduleSubject').innerHTML = '<option value="">حدث خطأ في التحميل</option>';
    }
}

function openScheduleModal(day = null, startTime = null, endTime = null) {
    const modal = document.getElementById('scheduleModal');
    const title = document.getElementById('scheduleModalTitle');
    const form = document.getElementById('scheduleForm');

    title.textContent = 'إضافة حصة دراسية';
    form.reset();
    document.getElementById('scheduleId').value = '';

    // Pre-fill if clicked on a specific cell
    if (day) {
        document.getElementById('scheduleDay').value = day;
        document.getElementById('startTime').value = startTime;
        document.getElementById('endTime').value = endTime;
    }

    // Pre-select current class
    if (currentClassId) {
        document.getElementById('scheduleClass').value = currentClassId;
        loadSubjectsForClass(currentClassId);
    }

    modal.classList.add('active');
}

function editSchedule(scheduleId) {
    const schedule = allSchedules.find(s => s.schedule_id === scheduleId);
    if (!schedule) return;

    const modal = document.getElementById('scheduleModal');
    const title = document.getElementById('scheduleModalTitle');

    title.textContent = 'تعديل الحصة الدراسية';

    document.getElementById('scheduleId').value = schedule.schedule_id;
    document.getElementById('scheduleClass').value = schedule.class_id;
    document.getElementById('scheduleSubject').value = schedule.class_subject_id;
    document.getElementById('scheduleDay').value = schedule.day_of_week;
    document.getElementById('startTime').value = schedule.start_time.substring(0, 5);
    document.getElementById('endTime').value = schedule.end_time.substring(0, 5);
    document.getElementById('roomNumber').value = schedule.room_number || '';

    loadSubjectsForClass(schedule.class_id);
    modal.classList.add('active');
}

async function deleteSchedule(scheduleId) {
    const schedule = allSchedules.find(s => s.schedule_id === scheduleId);
    if (!schedule) return;

    const confirmed = confirm(`هل أنت متأكد من حذف حصة "${schedule.subject_name}"؟\nاليوم: ${dayNames[schedule.day_of_week]}\nالوقت: ${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}`);

    if (!confirmed) return;

    const auth = checkAuth();
    try {
        const response = await fetch(`${API_URL}/schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${auth.token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            showToast('تم حذف الحصة بنجاح', 'success');
            loadSchedules(currentClassId, currentYear, currentSemester);
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('حدث خطأ في الحذف', 'error');
    }
}

// Event Listeners
document.getElementById('classSelect').addEventListener('change', (e) => {
    currentClassId = e.target.value;
    loadSchedules(currentClassId, currentYear, currentSemester);
});

// Changed from 'change' to 'input' and 'blur' for text input
document.getElementById('yearSelect').addEventListener('blur', (e) => {
    currentYear = e.target.value;
    if (currentClassId) {
        loadSchedules(currentClassId, currentYear, currentSemester);
    }
});

document.getElementById('yearSelect').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentYear = e.target.value;
        if (currentClassId) {
            loadSchedules(currentClassId, currentYear, currentSemester);
        }
    }
});

document.getElementById('semesterSelect').addEventListener('change', (e) => {
    currentSemester = e.target.value;
    if (currentClassId) {
        loadSchedules(currentClassId, currentYear, currentSemester);
    }
});

document.getElementById('createScheduleBtn').addEventListener('click', () => {
    if (!currentClassId) {
        showToast('يرجى اختيار صف دراسي أولاً', 'warning');
        return;
    }
    openScheduleModal();
});

document.getElementById('scheduleClass').addEventListener('change', (e) => {
    const classId = e.target.value;
    if (classId) {
        loadSubjectsForClass(classId);
    }
});

document.getElementById('scheduleSubject').addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const teacherUserId = selectedOption.getAttribute('data-teacher-user-id');
    const teacherSelect = document.getElementById('scheduleTeacher');

    if (teacherUserId) {
        const teacher = allTeachers.find(t => t.user_id == teacherUserId);
        if (teacher) teacherSelect.value = teacher.teacher_id;
        else teacherSelect.value = "";
    } else {
        if (e.target.value.startsWith('new_')) {
            teacherSelect.value = "";
        }
    }
});

document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const auth = checkAuth();
    const id = document.getElementById('scheduleId').value;
    const isEdit = !!id;

    let subjectValue = document.getElementById('scheduleSubject').value;
    const classId = document.getElementById('scheduleClass').value;
    const teacherId = document.getElementById('scheduleTeacher').value;

    const selectedOption = document.getElementById('scheduleSubject').options[document.getElementById('scheduleSubject').selectedIndex];
    let subjectId = selectedOption.getAttribute('data-subject-id');

    if (!subjectId && subjectValue.startsWith('new_')) {
        subjectId = subjectValue.replace('new_', '');
    }

    if (teacherId || subjectValue.startsWith('new_')) {
        try {
            const csResponse = await fetch(`${API_URL}/teachers/assignments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    class_id: classId,
                    subject_id: subjectId,
                    teacher_id: teacherId || null,
                    academic_year: currentYear,
                    semester: currentSemester
                })
            });

            const csData = await csResponse.json();
            if (csData.success) {
                subjectValue = csData.class_subject_id || csData.id;
            } else {
                showToast('فشل في تحديث تخصيص المعلم', 'error');
                return;
            }
        } catch (error) {
            console.error('Error updating class subject:', error);
            showToast('حدث خطأ في تخصيص المعلم', 'error');
            return;
        }
    } else {
        if (subjectId) {
            try {
                const csResponse = await fetch(`${API_URL}/teachers/assignments`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${auth.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        class_id: classId,
                        subject_id: subjectId,
                        teacher_id: teacherId || null, // null removes assignment if intended
                        academic_year: currentYear,
                        semester: currentSemester
                    })
                });
                const csData = await csResponse.json();
                if (csData.success) {
                    subjectValue = csData.class_subject_id || csData.id;
                }
            } catch (e) { console.error(e); }
        }
    }

    const payload = {
        class_subject_id: subjectValue,
        day_of_week: document.getElementById('scheduleDay').value,
        start_time: document.getElementById('startTime').value,
        end_time: document.getElementById('endTime').value,
        room_number: document.getElementById('roomNumber').value || null,
        academic_year: currentYear,
        semester: currentSemester
    };

    const url = isEdit ? `${API_URL}/schedules/${id}` : `${API_URL}/schedules`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${auth.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.success) {
            showToast(isEdit ? 'تم تحديث الحصة بنجاح' : 'تم إضافة الحصة بنجاح', 'success');
            document.getElementById('scheduleModal').classList.remove('active');
            loadSchedules(currentClassId, currentYear, currentSemester);
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('حدث خطأ', 'error');
    }
});

document.getElementById('closeScheduleModal').addEventListener('click', () => {
    document.getElementById('scheduleModal').classList.remove('active');
});

document.getElementById('cancelScheduleBtn').addEventListener('click', () => {
    document.getElementById('scheduleModal').classList.remove('active');
});

// Make functions global
window.openScheduleModal = openScheduleModal;
window.editSchedule = editSchedule;
window.deleteSchedule = deleteSchedule;

document.addEventListener('DOMContentLoaded', () => {
    loadClasses();
    loadTeachers();
});
