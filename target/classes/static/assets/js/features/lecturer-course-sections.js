import { API_CONFIG } from '../core/config.js';
import { buildAuthHeaders, fetchJson } from '../services/http.js';
import { escapeHtml } from '../core/utils.js';

/**
 * Module quản lý lớp HP phụ trách cho giảng viên
 * Bao gồm: danh sách lớp HP, xem DS sinh viên trong lớp
 */
export function createLecturerCourseSectionsFeature({ state, refs, auth, showError, clearError }) {

  let semesters = [];
  let currentSemesterId = '';

  function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.authState.token };
  }

  async function loadCourseSections() {
    if (!state.authState || !state.authState.token) return;
    clearError();

    try {
      // Load semesters for filter
      const semRes = await fetch('/api/semesters', { headers: authHeaders() });
      if (semRes.ok) {
        semesters = await semRes.json();
        renderSemesterFilter();
      }

      await fetchMyCourseSections();
    } catch (e) {
      console.error('[LecturerCS] Error:', e);
      showError('Lỗi tải danh sách lớp HP.');
    }
  }

  function renderSemesterFilter() {
    if (!refs.lecturerCsSemesterFilter) return;
    let html = '<option value="">-- Tất cả học kỳ --</option>';
    semesters.forEach(s => {
      const selected = s.id === currentSemesterId ? 'selected' : '';
      html += `<option value="${s.id}" ${selected}>${s.schoolYearName || s.name}</option>`;
    });
    refs.lecturerCsSemesterFilter.innerHTML = html;
  }

  async function fetchMyCourseSections() {
    if (!refs.lecturerCourseSectionsContent) return;
    refs.lecturerCourseSectionsContent.innerHTML =
      '<div class="text-center py-3"><span class="spinner-border spinner-border-sm"></span> Đang tải...</div>';

    try {
      let url = `${API_CONFIG.lecturer}/my-course-sections`;
      if (currentSemesterId) {
        url += `?semesterId=${currentSemesterId}`;
      }

      const res = await fetch(url, { headers: authHeaders() });

      if (!res.ok) {
        if (res.status === 404) {
          refs.lecturerCourseSectionsContent.innerHTML =
            '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>Không tìm thấy hồ sơ giảng viên cho tài khoản này.</div>';
        } else {
          refs.lecturerCourseSectionsContent.innerHTML =
            '<div class="alert alert-danger">Lỗi tải dữ liệu.</div>';
        }
        return;
      }

      const sections = await res.json();
      renderCourseSections(sections);
    } catch (e) {
      console.error('[LecturerCS] Fetch error:', e);
      refs.lecturerCourseSectionsContent.innerHTML =
        '<div class="alert alert-danger">Lỗi kết nối.</div>';
    }
  }

  function renderCourseSections(sections) {
    if (!refs.lecturerCourseSectionsContent) return;

    if (!sections || sections.length === 0) {
      refs.lecturerCourseSectionsContent.innerHTML =
        '<div class="text-muted text-center py-4">' +
        '<i class="bi bi-journal-x fs-1 d-block mb-2"></i>' +
        'Bạn chưa được phân công lớp học phần nào' +
        (currentSemesterId ? ' trong học kỳ này.' : '.') +
        '</div>';
      return;
    }

    // Summary cards
    const totalStudents = sections.reduce((sum, s) => sum + (s.enrolledStudents || 0), 0);
    const totalCredits = sections.reduce((sum, s) => sum + (s.credits || 0), 0);

    let summaryHtml = '<div class="row mb-3">' +
      '<div class="col-md-4"><div class="info-box bg-primary text-white p-3 rounded">' +
      '<div class="info-box-content"><span class="info-box-text">Lớp HP phụ trách</span>' +
      '<span class="info-box-number fs-3">' + sections.length + '</span></div></div></div>' +
      '<div class="col-md-4"><div class="info-box bg-success text-white p-3 rounded">' +
      '<div class="info-box-content"><span class="info-box-text">Tổng sinh viên</span>' +
      '<span class="info-box-number fs-3">' + totalStudents + '</span></div></div></div>' +
      '<div class="col-md-4"><div class="info-box bg-info text-white p-3 rounded">' +
      '<div class="info-box-content"><span class="info-box-text">Tổng tín chỉ</span>' +
      '<span class="info-box-number fs-3">' + totalCredits + '</span></div></div></div>' +
      '</div>';

    // Table
    let tableHtml = '<div class="table-responsive"><table class="table table-hover table-striped mb-0">' +
      '<thead><tr>' +
      '<th>STT</th>' +
      '<th>Mã LHP</th>' +
      '<th>Tên môn học</th>' +
      '<th class="text-center">Tín chỉ</th>' +
      '<th class="text-center">Sĩ số</th>' +
      '<th>Học kỳ</th>' +
      '<th class="text-center">Trạng thái</th>' +
      '<th class="text-end">Hành động</th>' +
      '</tr></thead><tbody>';

    sections.forEach((cs, i) => {
      const statusBadge = cs.status === 'open'
        ? '<span class="badge bg-success">Đang mở</span>'
        : '<span class="badge bg-secondary">' + escapeHtml(cs.status || 'N/A') + '</span>';

      tableHtml += '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><strong>' + escapeHtml(cs.code || '') + '</strong></td>' +
        '<td>' + escapeHtml(cs.courseName || '') + '</td>' +
        '<td class="text-center">' + (cs.credits || '') + '</td>' +
        '<td class="text-center"><span class="badge bg-info">' + (cs.enrolledStudents || 0) + '/' + (cs.maxStudents || '') + '</span></td>' +
        '<td>' + escapeHtml(cs.semesterName || cs.schoolYearName || '') + '</td>' +
        '<td class="text-center">' + statusBadge + '</td>' +
        '<td class="text-end">' +
        '<button class="btn btn-sm btn-outline-primary me-1 btn-view-students" data-id="' + cs.id + '" title="Xem DS sinh viên">' +
        '<i class="bi bi-people me-1"></i>DS Sinh viên</button>' +
        '</td>' +
        '</tr>';
    });

    tableHtml += '</tbody></table></div>';

    refs.lecturerCourseSectionsContent.innerHTML = summaryHtml + tableHtml;

    // Bind view students buttons
    refs.lecturerCourseSectionsContent.querySelectorAll('.btn-view-students').forEach(btn => {
      btn.addEventListener('click', () => {
        loadStudentsInSection(btn.dataset.id);
      });
    });
  }

  async function loadStudentsInSection(courseSectionId) {
    if (!refs.lecturerCourseSectionsContent) return;

    // Show a student list panel below the table
    let panel = document.getElementById('lecturerStudentListPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'lecturerStudentListPanel';
      panel.className = 'mt-3';
      refs.lecturerCourseSectionsContent.appendChild(panel);
    }

    panel.innerHTML = '<div class="card border-primary">' +
      '<div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">' +
      '<span><i class="bi bi-people-fill me-2"></i>Danh sách sinh viên</span>' +
      '<button class="btn btn-sm btn-light" id="btnCloseLecturerStudentPanel"><i class="bi bi-x-lg"></i></button>' +
      '</div>' +
      '<div class="card-body"><div class="text-center py-3"><span class="spinner-border spinner-border-sm"></span> Đang tải...</div></div>' +
      '</div>';

    // Scroll to panel
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('btnCloseLecturerStudentPanel')?.addEventListener('click', () => {
      panel.innerHTML = '';
    });

    try {
      const res = await fetch(
        `${API_CONFIG.lecturer}/course-section/${courseSectionId}/students`,
        { headers: authHeaders() }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        panel.querySelector('.card-body').innerHTML =
          '<div class="alert alert-warning mb-0">' + escapeHtml(body.error || 'Không thể tải dữ liệu.') + '</div>';
        return;
      }

      const data = await res.json();
      renderStudentList(panel, data);
    } catch (e) {
      console.error('[LecturerCS] Student list error:', e);
      panel.querySelector('.card-body').innerHTML =
        '<div class="alert alert-danger mb-0">Lỗi kết nối.</div>';
    }
  }

  function renderStudentList(panel, data) {
    const students = data.students || [];
    const headerInfo = `<strong>${escapeHtml(data.courseSectionCode || '')}</strong> — ${escapeHtml(data.courseName || '')}` +
      ` <span class="badge bg-secondary ms-2">${students.length} sinh viên</span>`;

    panel.querySelector('.card-header span').innerHTML =
      '<i class="bi bi-people-fill me-2"></i>' + headerInfo;

    if (students.length === 0) {
      panel.querySelector('.card-body').innerHTML =
        '<div class="text-muted text-center py-3">Chưa có sinh viên đăng ký lớp HP này.</div>';
      return;
    }

    let tableHtml = '<div class="table-responsive"><table class="table table-sm table-hover mb-0">' +
      '<thead><tr>' +
      '<th>STT</th><th>MSSV</th><th>Họ và tên</th><th>Email</th><th class="text-center">Trạng thái</th>' +
      '</tr></thead><tbody>';

    students.forEach((s, i) => {
      const statusBadge = s.status === 'ENROLLED'
        ? '<span class="badge bg-success">Đã đăng ký</span>'
        : '<span class="badge bg-warning">' + escapeHtml(s.status || 'N/A') + '</span>';

      tableHtml += '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><strong>' + escapeHtml(s.studentCode || '') + '</strong></td>' +
        '<td>' + escapeHtml(s.fullName || '') + '</td>' +
        '<td>' + escapeHtml(s.email || '') + '</td>' +
        '<td class="text-center">' + statusBadge + '</td>' +
        '</tr>';
    });

    tableHtml += '</tbody></table></div>';
    panel.querySelector('.card-body').innerHTML = tableHtml;
  }

  function bindEvents() {
    if (refs.lecturerCsSemesterFilter) {
      refs.lecturerCsSemesterFilter.addEventListener('change', (e) => {
        currentSemesterId = e.target.value;
        fetchMyCourseSections();
      });
    }
  }

  function showUnauthorizedState() {
    if (refs.lecturerCourseSectionsContent) {
      refs.lecturerCourseSectionsContent.innerHTML =
        '<div class="alert alert-danger">Không có quyền truy cập.</div>';
    }
  }

  function resetLoggedOutState() {
    currentSemesterId = '';
    semesters = [];
    if (refs.lecturerCsSemesterFilter) {
      refs.lecturerCsSemesterFilter.innerHTML = '<option value="">-- Tất cả học kỳ --</option>';
    }
    if (refs.lecturerCourseSectionsContent) {
      refs.lecturerCourseSectionsContent.innerHTML = '';
    }
  }

  return {
    loadCourseSections,
    bindEvents,
    showUnauthorizedState,
    resetLoggedOutState,
  };
}
