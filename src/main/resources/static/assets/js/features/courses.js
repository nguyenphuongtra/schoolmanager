export function createCoursesFeature({ state, refs, auth, showError, clearError }) {
    const API_COURSES = '/api/courses';

    let allCourses = [];
    let departments = [];

    function authHeaders() {
        return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.authState.token };
    }

    async function loadCourses() {
        if (!state.authState || !state.authState.token) return;
        clearError();

        refs.coursesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Đang tải...</td></tr>';

        try {
            const [courseRes, deptRes] = await Promise.all([
                fetch(API_COURSES, { headers: authHeaders() }),
                fetch('/api/departments', { headers: authHeaders() })
            ]);

            if (deptRes.ok) {
                departments = await deptRes.json();
            }

            if (courseRes.ok) {
                allCourses = await courseRes.json();
                applySearch();
            } else if (courseRes.status === 401) {
                refs.coursesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Phiên đăng nhập hết hạn.</td></tr>';
                showError('Phiên đăng nhập hết hạn.');
            } else if (courseRes.status === 403) {
                refs.coursesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Bạn không có quyền xem danh sách môn học.</td></tr>';
            } else {
                refs.coursesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Lỗi tải dữ liệu.</td></tr>';
                showError('Lỗi tải danh sách môn học.');
            }
        } catch (e) {
            console.error('Courses error:', e);
            refs.coursesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Không thể kết nối đến máy chủ.</td></tr>';
            showError('Không thể kết nối đến máy chủ.');
        }
    }

    function getDepartmentName(departmentId) {
        if (!departmentId) return '--';
        const dept = departments.find(d => d.id === departmentId);
        return dept ? dept.name : '--';
    }

    function applySearch() {
        const keyword = (refs.coursesSearchInput.value || '').toLowerCase().trim();
        const filtered = keyword
            ? allCourses.filter(c =>
                (c.code || '').toLowerCase().includes(keyword) ||
                (c.name || '').toLowerCase().includes(keyword) ||
                (c.nameEn || '').toLowerCase().includes(keyword)
            )
            : allCourses;

        renderCourses(filtered);
    }

    function renderCourses(courses) {
        if (courses.length === 0) {
            refs.coursesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Không tìm thấy môn học nào.</td></tr>';
            return;
        }

        refs.coursesTableBody.innerHTML = courses.map(c => {
            const credits = c.credits !== null && c.credits !== undefined ? c.credits : '--';
            const type = formatCourseType(c.courseType);
            const dept = getDepartmentName(c.departmentId);
            const active = c.isActive ? '<span class="badge bg-success">Đang hoạt động</span>' : '<span class="badge bg-secondary">Không hoạt động</span>';

            return `
            <tr>
                <td><span class="fw-semibold text-primary">${c.code || '--'}</span></td>
                <td>${c.name || '--'}</td>
                <td class="text-muted">${c.nameEn || '--'}</td>
                <td class="text-center">${credits}</td>
                <td>${type}</td>
                <td>${dept}</td>
            </tr>`;
        }).join('');
    }

    function formatCourseType(type) {
        const map = {
            'required': '<span class="badge bg-primary">Bắt buộc</span>',
            'elective': '<span class="badge bg-info text-dark">Tự chọn</span>',
            'internship': '<span class="badge bg-warning text-dark">Thực tập</span>',
            'thesis': '<span class="badge bg-secondary">Luận văn</span>',
        };
        return map[type] || (type ? `<span class="badge bg-light text-dark">${type}</span>` : '--');
    }

    function bindEvents() {
        refs.coursesSearchInput.addEventListener('input', applySearch);
    }

    function showUnauthorizedState() {
        refs.coursesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Vui lòng đăng nhập để xem danh sách môn học.</td></tr>';
    }

    function resetLoggedOutState() {
        allCourses = [];
        departments = [];
        refs.coursesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Đang tải...</td></tr>';
        refs.coursesSearchInput.value = '';
    }

    return {
        loadCourses,
        bindEvents,
        showUnauthorizedState,
        resetLoggedOutState
    };
}
