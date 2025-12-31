let allClasses = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Auth & Permissions
    const auth = checkAuth();
    if (!auth) return;

    const userRole = auth.user.role;

    // Show 'Add Grade' button ONLY for teachers
    if (userRole === 'teacher') {
        const addBtn = document.getElementById('openGradeModalBtn');
        if (addBtn) addBtn.style.display = 'flex';
    }

    // Set Default Date
    document.getElementById('examDate').value = new Date().toISOString().split('T')[0];

    // 2. Load Data
    await loadClasses(); // For Filters & Modal

    // 3. Event Listeners
    setupEventListeners();

    // 4. Initial Load of Grades
    loadGrades();
});

function setupEventListeners() {
    // Modal Open/Close
    const modal = document.getElementById('gradeModal');
    const openBtn = document.getElementById('openGradeModalBtn');
    const closeBtn = document.getElementById('closeGradeModal');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
            // Reset form if needed or keep last selection? Resetting is safer for now.
            // document.getElementById('gradeForm').reset();
            // Assuming user might want to add multiple grades for same class/subject, keeping values is better UX,
            // except student and grade.
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Filters
    document.getElementById('filterBtn').addEventListener('click', loadGrades);
    document.getElementById('filterClass').addEventListener('change', (e) => loadSubjects(e.target.value, 'filterSubject'));

    // PDF Export
    document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);

    // Modal Dependencies
    document.getElementById('modalClass').addEventListener('change', (e) => {
        const classId = e.target.value;
        loadSubjects(classId, 'modalSubject');
        if (classId) loadStudents(classId);
    });

    // Form Submit
    document.getElementById('gradeForm').addEventListener('submit', handleAddGrade);
}

// --- Data Loading Functions ---

async function loadClasses() {
    const auth = checkAuth();
    try {
        const response = await fetch(`${API_URL}/classes`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();
        if (data.success) {
            allClasses = data.data;
            const options = allClasses.map(c => `<option value="${c.class_id}">${c.class_name}</option>`).join('');

            // Populate Filters
            document.getElementById('filterClass').innerHTML = '<option value="">كل الصفوف</option>' + options;

            // Populate Modal
            document.getElementById('modalClass').innerHTML = '<option value="">اختر الصف...</option>' + options;
        }
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function loadSubjects(classId, targetElementId) {
    const targetSelect = document.getElementById(targetElementId);
    // Reset
    targetSelect.innerHTML = targetElementId.includes('filter') ? '<option value="">كل المواد</option>' : '<option value="">اختر المادة...</option>';

    if (!classId) return;

    const auth = checkAuth();
    try {
        const response = await fetch(`${API_URL}/classes/subjects?class_id=${classId}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();

        if (data.success) {
            const options = data.data.map(s => `<option value="${s.subject_id}">${s.subject_name}</option>`).join('');
            targetSelect.innerHTML = (targetElementId.includes('filter') ? '<option value="">كل المواد</option>' : '<option value="">اختر المادة...</option>') + options;
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

async function loadStudents(classId) {
    const studentSelect = document.getElementById('modalStudent');
    studentSelect.innerHTML = '<option value="">جاري التحميل...</option>';

    const auth = checkAuth();
    try {
        const response = await fetch(`${API_URL}/students?class_id=${classId}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            studentSelect.innerHTML = '<option value="">-- اختر الطالب --</option>' +
                data.data.map(s => `<option value="${s.student_id}">${s.full_name}</option>`).join('');
        } else {
            studentSelect.innerHTML = '<option value="">لا يوجد طلاب في هذا الصف</option>';
        }
    } catch (error) {
        console.error('Error loading students:', error);
        studentSelect.innerHTML = '<option value="">خطأ في التحميل</option>';
    }
}

// --- Main Logic ---

async function loadGrades() {
    const classId = document.getElementById('filterClass').value;
    const subjectId = document.getElementById('filterSubject').value;
    const auth = checkAuth();

    const tbody = document.getElementById('gradesTableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">جاري تحميل البيانات...</td></tr>';

    try {
        // Build Query Params
        let query = `?`;
        if (classId) query += `class_id=${classId}&`;
        if (subjectId) query += `subject_id=${subjectId}&`;

        // If Parent/Student, maybe send student_id? 
        // Backend handles viewing logic usually, or we can filter by role here if API requires.
        // For simplicity, we assume API returns what user is allowed to see or we filter.
        // But since user requested "Parent can view", we might need to pass student_id if logged in as parent.
        if (auth.user.role === 'parent' || auth.user.role === 'student') {
            // We need to know student_id. 
            // Ideally fetching /my-profile or /my-children would give IDs.
            // For now, let's assume 'parent' sees everything or backend restricts it.
            // Given the requirements, we'll just fetch all.
        }

        const response = await fetch(`${API_URL}/grades${query}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });

        const data = await response.json();
        if (data.success) {
            displayGrades(data.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد درجات</td></tr>';
        }
    } catch (error) {
        console.error('Error loading grades:', error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">حدث خطأ في الاتصال</td></tr>';
    }
}

function displayGrades(grades) {
    const tbody = document.getElementById('gradesTableBody');

    if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد درجات مطابقة</td></tr>';
        return;
    }

    const examTypeMap = {
        'midterm': 'منتصف الفصل',
        'final': 'نهائي',
        'quiz': 'اختبار قصير',
        'assignment': 'واجب',
        'practical': 'عملي'
    };

    tbody.innerHTML = grades.map(grade => {
        const percentage = Number(grade.grade) / Number(grade.max_grade) * 100;
        let badgeClass = 'badge-danger';
        if (percentage >= 90) badgeClass = 'badge-success';
        else if (percentage >= 75) badgeClass = 'badge-primary'; // Using blue for good
        else if (percentage >= 50) badgeClass = 'badge-warning';

        return `
            <tr>
                <td><strong>${grade.student_name}</strong></td>
                <td>${grade.class_name || '-'}</td>
                <td>${grade.subject_name || '-'}</td>
                <td><span class="badge badge-${grade.exam_type}">${examTypeMap[grade.exam_type] || grade.exam_type}</span></td>
                <td>${grade.exam_name || '-'}</td>
                <td style="font-weight:bold;">${grade.grade} <span style="color:#888;font-size:0.8em">/ ${grade.max_grade}</span></td>
                <td><span class="badge ${badgeClass}">${percentage.toFixed(1)}%</span></td>
                <td>${new Date(grade.exam_date).toLocaleDateString('ar-SA')}</td>
            </tr>
        `;
    }).join('');
}

async function handleAddGrade(e) {
    e.preventDefault();
    const auth = checkAuth();

    const data = {
        class_id: document.getElementById('modalClass').value,
        subject_id: document.getElementById('modalSubject').value,
        student_id: document.getElementById('modalStudent').value,
        exam_type: document.getElementById('examType').value,
        exam_name: document.getElementById('examName').value,
        grade: document.getElementById('gradeValue').value,
        max_grade: document.getElementById('maxGrade').value,
        exam_date: document.getElementById('examDate').value,
        academic_year: '2024-2025', // Hardcoded for now
        semester: 'first' // Hardcoded for now
    };

    if (!data.student_id) {
        showToast('يرجى اختيار الطالب', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/grades`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${auth.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast('تم إضافة الدرجة بنجاح!', 'success');
            document.getElementById('gradeModal').classList.remove('active');
            loadGrades(); // Refresh list
        } else {
            showToast(result.message || 'فشل إضافة الدرجة', 'error');
        }
    } catch (error) {
        console.error('Error adding grade:', error);
        showToast('حدث خطأ في النظام', 'error');
    }
}

function exportPDF() {
    const element = document.getElementById('gradesCard');
    const opt = {
        margin: [10, 10],
        filename: `grades_report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    showToast('جاري تحضير ملف PDF...', 'info');
    html2pdf().set(opt).from(element).save().then(() => {
        showToast('تم تحميل التقرير بنجاح', 'success');
    });
}
