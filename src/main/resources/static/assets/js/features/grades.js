import { API_CONFIG } from '../core/config.js';
import { buildAuthHeaders, fetchJson } from '../services/http.js';
import { escapeHtml } from '../core/utils.js';

export function createGradesFeature(context) {
  const { state, refs, auth } = context;

  function isStudent() {
    return auth.hasRole('STUDENT');
  }

  function isLecturer() {
    return auth.hasRole('LECTURER') || auth.hasRole('SUPER_ADMIN');
  }

  async function loadData() {
    if (isStudent()) {
      await loadTranscript();
    } else if (isLecturer()) {
      await loadLecturerView();
    }
  }

  // ===== STUDENT VIEW: Transcript =====
  async function loadTranscript() {
    try {
      const { response, data } = await fetchJson(API_CONFIG.grades + '/transcript', {
        headers: buildAuthHeaders(state.authState),
      });

      if (!response.ok) {
        refs.gradesContent.innerHTML = '<div class="alert alert-warning">Không thể tải bảng điểm.</div>';
        return;
      }

      renderTranscript(data);
    } catch (err) {
      console.error('[Grades] Transcript error', err);
      refs.gradesContent.innerHTML = '<div class="alert alert-danger">Lỗi kết nối.</div>';
    }
  }

  function renderTranscript(transcript) {
    if (!transcript || !transcript.rows || transcript.rows.length === 0) {
      refs.gradesContent.innerHTML = '<div class="text-muted text-center py-4">Chưa có dữ liệu điểm.</div>';
      return;
    }

    let summaryHtml = '<div class="row mb-3">' +
      '<div class="col-md-3"><div class="info-box bg-primary text-white p-3 rounded">' +
        '<div class="info-box-content"><span class="info-box-text">GPA Tích lũy</span>' +
        '<span class="info-box-number fs-3">' + (transcript.gpa || '0.00') + '</span></div></div></div>' +
      '<div class="col-md-3"><div class="info-box bg-success text-white p-3 rounded">' +
        '<div class="info-box-content"><span class="info-box-text">Tín chỉ tích lũy</span>' +
        '<span class="info-box-number fs-3">' + (transcript.earnedCredits || 0) + '</span></div></div></div>' +
      '<div class="col-md-3"><div class="info-box bg-info text-white p-3 rounded">' +
        '<div class="info-box-content"><span class="info-box-text">Tổng tín chỉ</span>' +
        '<span class="info-box-number fs-3">' + (transcript.totalCredits || 0) + '</span></div></div></div>' +
      '<div class="col-md-3"><div class="info-box bg-secondary text-white p-3 rounded">' +
        '<div class="info-box-content"><span class="info-box-text">Số môn học</span>' +
        '<span class="info-box-number fs-3">' + transcript.rows.length + '</span></div></div></div>' +
    '</div>';

    // Extract unique component names
    const allCompNames = new Set();
    if (transcript.rows) {
      transcript.rows.forEach(row => {
        if (row.componentScores) {
          Object.keys(row.componentScores).forEach(k => allCompNames.add(k));
        }
      });
    }
    const predefinedOrder = ['Chuyên cần', 'Thường xuyên', 'Giữa kỳ', 'Cuối kỳ'];
    const compColumns = Array.from(allCompNames).sort((a, b) => {
      const idxA = predefinedOrder.indexOf(a);
      const idxB = predefinedOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    let headerHtml = '<th>STT</th><th>Mã LHP</th><th>Tên môn</th><th class="text-center">Tín chỉ</th>';
    compColumns.forEach(c => { headerHtml += '<th class="text-center">' + escapeHtml(c) + '</th>'; });
    headerHtml += '<th class="text-center">Điểm TB</th><th class="text-center">Điểm chữ</th><th class="text-center">Điểm hệ 4</th><th class="text-center">Kết quả</th><th>Học kỳ</th>';

    let tableHtml = '<div class="table-responsive"><table class="table table-hover table-striped text-nowrap mb-0">' +
      '<thead><tr>' + headerHtml + '</tr></thead><tbody>';

    transcript.rows.forEach(function (row, i) {
      const resultClass = row.result === 'PASS' ? 'text-success' : (row.result === 'FAIL' ? 'text-danger' : '');
      const resultLabel = row.result === 'PASS' ? 'Đạt' : (row.result === 'FAIL' ? 'Không đạt' : '—');
      const componentScores = row.componentScores || {};
      
      let rowHtml = '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(row.courseSectionCode || '') + '</td>' +
        '<td>' + escapeHtml(row.courseName || '') + '</td>' +
        '<td class="text-center">' + (row.credits || '') + '</td>';

      compColumns.forEach(c => {
         const score = componentScores[c];
         rowHtml += '<td class="text-center">' + (score != null ? score : '—') + '</td>';
      });

      rowHtml += '<td class="text-center fw-bold">' + (row.totalScore != null ? row.totalScore : '—') + '</td>' +
        '<td class="text-center fw-bold">' + (row.letterGrade || '—') + '</td>' +
        '<td class="text-center">' + (row.gpaValue != null ? row.gpaValue : '—') + '</td>' +
        '<td class="text-center ' + resultClass + ' fw-bold">' + resultLabel + '</td>' +
        '<td>' + escapeHtml(row.semesterName || '') + '</td>' +
      '</tr>';

      tableHtml += rowHtml;
    });

    tableHtml += '</tbody></table></div>';
    refs.gradesContent.innerHTML = summaryHtml + tableHtml;
  }

  // ===== LECTURER VIEW =====
  async function loadLecturerView() {
    refs.gradesContent.innerHTML =
      '<div class="mb-3">' +
        '<label class="form-label fw-bold">Chọn lớp học phần phụ trách:</label>' +
        '<select class="form-select" id="gradeCourseSectionSelect"><option value="">-- Chọn lớp HP --</option></select>' +
      '</div>' +
      '<div id="gradeCourseSectionContent"></div>';

    // Load course sections assigned to this lecturer
    try {
      const lecturerApiUrl = API_CONFIG.lecturer
        ? API_CONFIG.lecturer + '/my-course-sections'
        : API_CONFIG.courseSections + '/search?keyword=&page=0&size=100';

      const res = await fetch(lecturerApiUrl, {
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
      });

      if (!res.ok) {
        // Fallback to admin API for SUPER_ADMIN
        const { data: sections } = await fetchJson(API_CONFIG.courseSections + '/search?keyword=&page=0&size=100', {
          headers: buildAuthHeaders(state.authState),
        });
        const items = sections.content || sections || [];
        populateCourseSectionSelect(items);
      } else {
        const sections = await res.json();
        populateCourseSectionSelect(sections);
      }
    } catch (err) {
      console.error('[Grades] Load course sections error', err);
      // Fallback
      try {
        const { data: sections } = await fetchJson(API_CONFIG.courseSections + '/search?keyword=&page=0&size=100', {
          headers: buildAuthHeaders(state.authState),
        });
        const items = sections.content || sections || [];
        populateCourseSectionSelect(items);
      } catch (e) {
        console.error('[Grades] Fallback also failed', e);
      }
    }
  }

  function populateCourseSectionSelect(sections) {
    const semSelect = document.getElementById('gradeCourseSectionSelect');
    if (!semSelect) return;

    if (!sections || sections.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = '(Không có lớp HP nào)';
      opt.disabled = true;
      semSelect.appendChild(opt);
      return;
    }

    sections.forEach(function (cs) {
      const opt = document.createElement('option');
      opt.value = cs.id;
      const label = cs.code || '';
      const courseName = cs.courseName ? ' - ' + cs.courseName : '';
      const semName = cs.semesterName ? ' (' + cs.semesterName + ')' : '';
      opt.textContent = label + courseName + semName;
      semSelect.appendChild(opt);
    });

    semSelect.addEventListener('change', function () {
      if (this.value) loadCourseSectionGrades(this.value);
    });
  }

  async function loadCourseSectionGrades(courseSectionId) {
    const container = document.getElementById('gradeCourseSectionContent');
    container.innerHTML = '<div class="text-center py-3"><span class="spinner-border spinner-border-sm"></span> Đang tải...</div>';

    try {
      const { response, data } = await fetchJson(API_CONFIG.grades + '/course-section/' + courseSectionId, {
        headers: buildAuthHeaders(state.authState),
      });

      if (!response.ok) {
        container.innerHTML = '<div class="alert alert-warning">Không thể tải dữ liệu điểm.</div>';
        return;
      }

      renderLecturerGradeTable(data, container);
    } catch (err) {
      console.error('[Grades] Load CS grades error', err);
      container.innerHTML = '<div class="alert alert-danger">Lỗi kết nối.</div>';
    }
  }

  function renderLecturerGradeTable(data, container) {
    const components = data.components || [];
    const students = data.students || [];

    if (students.length === 0) {
      container.innerHTML = '<div class="text-muted text-center py-3">Chưa có sinh viên trong lớp.</div>';
      return;
    }

    let headerHtml = '<th>STT</th><th>MSSV</th><th>Họ tên</th>';
    components.forEach(c => { headerHtml += '<th class="text-center">' + escapeHtml(c.name) + '</th>'; });
    headerHtml += '<th class="text-center">Tổng kết</th>';

    let bodyHtml = '';
    students.forEach(function (s, i) {
      bodyHtml += '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(s.studentCode || '') + '</td><td>' + escapeHtml(s.studentName || '') + '</td>';
      const grades = s.grades || {};

      components.forEach(function (c) {
        const g = grades[c.id] || {};
        const val = g.score != null ? g.score : '';
        const locked = g.isLocked;
        bodyHtml += '<td class="text-center"><input type="number" step="0.01" min="0" max="10" class="form-control form-control-sm text-center grade-input" ' +
          'value="' + val + '" data-reg="' + s.registrationId + '" data-comp="' + c.id + '"' +
          (locked ? ' disabled' : '') + ' style="width:70px;display:inline-block;" /></td>';
      });

      const total = grades['total'] || {};
      bodyHtml += '<td class="text-center fw-bold">' +
        (total.score != null ? total.score : '—') +
        (total.letterGrade ? ' (' + total.letterGrade + ')' : '') +
      '</td></tr>';
    });

    container.innerHTML = '<div class="table-responsive"><table class="table table-bordered table-sm mb-2">' +
      '<thead><tr>' + headerHtml + '</tr></thead><tbody>' + bodyHtml + '</tbody></table></div>' +
      '<button class="btn btn-primary btn-sm" id="btnSaveGrades"><i class="bi bi-save me-1"></i>Lưu điểm</button>';

    document.getElementById('btnSaveGrades')?.addEventListener('click', () => saveAllGrades(container));
  }

  async function saveAllGrades(container) {
    const inputs = container.querySelectorAll('.grade-input');
    let saved = 0;
    for (const input of inputs) {
      if (input.value === '' || input.disabled) continue;
      try {
        await fetchJson(API_CONFIG.grades, {
          method: 'POST',
          headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            registrationId: input.dataset.reg,
            gradeComponentId: input.dataset.comp,
            score: parseFloat(input.value),
          }),
        });
        saved++;
      } catch (err) {
        console.error('[Grades] Save error', err);
      }
    }
    alert('Đã lưu ' + saved + ' điểm thành công.');
    const sel = document.getElementById('gradeCourseSectionSelect');
    if (sel && sel.value) loadCourseSectionGrades(sel.value);
  }

  return {
    bindEvents() { /* events bound dynamically */ },
    loadGrades() {
      loadData();
    },
    showUnauthorizedState() {
      if (refs.gradesContent) {
        refs.gradesContent.innerHTML = '<div class="alert alert-danger">Không có quyền truy cập.</div>';
      }
    },
    resetLoggedOutState() {
      if (refs.gradesContent) refs.gradesContent.innerHTML = '';
    }
  };
}
