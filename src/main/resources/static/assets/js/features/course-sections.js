import { API_CONFIG, PAGE_SIZE } from '../core/config.js';
import { buildAuthHeaders, fetchJson } from '../services/http.js';
import { escapeHtml, highlightText, parseResponse } from '../core/utils.js';

export function createCourseSectionsFeature(context) {
  const { state, refs, auth } = context;

  // Cache danh sách giảng viên
  let employeeList = [];

  function canManage() {
    return auth.hasRole('SUPER_ADMIN') || auth.hasRole('ACADEMIC_AFFAIRS');
  }

  async function loadCourseSections(page) {
    if (!canManage()) return;
    page = page || 0;
    const keyword = refs.courseSectionSearchInput?.value?.trim() || '';
    const url = API_CONFIG.courseSections + '/search?page=' + page + '&size=' + PAGE_SIZE +
      (keyword ? '&keyword=' + encodeURIComponent(keyword) : '');

    try {
      const { response, data } = await fetchJson(url, {
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
      });
      if (!response.ok) {
        refs.courseSectionTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-3">Lỗi tải dữ liệu</td></tr>';
        return;
      }
      const parsed = parseResponse(data);
      state.pagination.courseSections = { page, totalPages: parsed.totalPages, totalElements: parsed.totalElements };
      renderTable(parsed.items, keyword);
      renderPagination(parsed.totalPages, page);
      renderPaginationInfo(page, parsed.items.length, parsed.totalElements);
    } catch (err) {
      console.error('[CourseSections] Load error', err);
      refs.courseSectionTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-3">Lỗi kết nối</td></tr>';
    }
  }

  function renderTable(items, keyword) {
    if (!items || items.length === 0) {
      refs.courseSectionTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
      return;
    }
    refs.courseSectionTableBody.innerHTML = items.map(function (cs) {
      const statusBadge = cs.status === 'open'
        ? '<span class="badge bg-success">Mở</span>'
        : '<span class="badge bg-secondary">' + escapeHtml(cs.status || '') + '</span>';

      const employeeDisplay = cs.employeeName
        ? '<span class="badge bg-primary"><i class="bi bi-person-fill me-1"></i>' + escapeHtml(cs.employeeName) + '</span>'
        : '<span class="text-muted fst-italic">Chưa phân công</span>';

      return '<tr>' +
        '<td>' + highlightText(cs.code || '', keyword) + '</td>' +
        '<td>' + escapeHtml(cs.academicYear || '') + '</td>' +
        '<td>' + employeeDisplay + '</td>' +
        '<td>' + escapeHtml(cs.classType || '') + '</td>' +
        '<td class="text-center">' + (cs.maxStudents || '') + '</td>' +
        '<td class="text-center">' + statusBadge + '</td>' +
        '<td class="text-end">' +
          '<button class="btn btn-warning btn-sm me-1" onclick="window.__editCourseSection__(\'' + cs.id + '\')" title="Sửa"><i class="bi bi-pencil-square"></i></button>' +
          '<button class="btn btn-danger btn-sm" onclick="window.__deleteCourseSection__(\'' + cs.id + '\')" title="Xóa"><i class="bi bi-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderPagination(totalPages, currentPage) {
    if (!refs.courseSectionPagination) return;
    if (totalPages <= 1) { refs.courseSectionPagination.innerHTML = ''; return; }
    let html = '';
    for (let i = 0; i < totalPages; i++) {
      html += '<li class="page-item ' + (i === currentPage ? 'active' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + i + '">' + (i + 1) + '</a></li>';
    }
    refs.courseSectionPagination.innerHTML = html;
    refs.courseSectionPagination.querySelectorAll('.page-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        loadCourseSections(parseInt(link.dataset.page));
      });
    });
  }

  function renderPaginationInfo(page, count, total) {
    if (!refs.courseSectionPaginationInfo) return;
    const start = page * PAGE_SIZE + 1;
    const end = page * PAGE_SIZE + count;
    refs.courseSectionPaginationInfo.textContent = 'Hiển thị ' + start + '–' + end + ' / ' + total;
  }

  /** Load danh sách giảng viên cho dropdown */
  async function loadEmployeeOptions() {
    if (employeeList.length > 0) return; // đã load
    try {
      const { response, data } = await fetchJson(API_CONFIG.employees, {
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
      });
      if (response.ok) {
        employeeList = (Array.isArray(data) ? data : (data.content || [])).filter(
          emp => emp.deletedAt == null
        );
      }
    } catch (err) {
      console.error('[CourseSections] Load employees error', err);
    }
  }

  function populateEmployeeSelect(selectedId) {
    if (!refs.courseSectionEmployee) return;
    let html = '<option value="">-- Chưa phân công --</option>';
    employeeList.forEach(function (emp) {
      const selected = emp.id === selectedId ? 'selected' : '';
      const label = emp.code + ' – ' + emp.fullName;
      html += '<option value="' + emp.id + '" ' + selected + '>' + escapeHtml(label) + '</option>';
    });
    refs.courseSectionEmployee.innerHTML = html;
  }

  async function openModal(cs) {
    refs.courseSectionModalTitle.textContent = cs ? 'Sửa lớp học phần' : 'Thêm lớp học phần';
    refs.courseSectionId.value = cs ? cs.id : '';
    refs.courseSectionCode.value = cs ? cs.code || '' : '';
    refs.courseSectionAcademicYear.value = cs ? cs.academicYear || '' : '';
    refs.courseSectionMaxStudents.value = cs ? cs.maxStudents || '' : '';
    refs.courseSectionClassType.value = cs ? cs.classType || '' : '';
    refs.courseSectionStatus.value = cs ? cs.status || 'open' : 'open';
    refs.courseSectionNote.value = cs ? cs.note || '' : '';

    // Load danh sách giảng viên và populate dropdown
    await loadEmployeeOptions();
    populateEmployeeSelect(cs ? cs.employeeId : null);

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('courseSectionModal'));
    modal.show();
  }

  async function saveSection() {
    const id = refs.courseSectionId.value;
    const employeeVal = refs.courseSectionEmployee ? refs.courseSectionEmployee.value : '';

    const body = {
      code: refs.courseSectionCode.value,
      academicYear: refs.courseSectionAcademicYear.value,
      maxStudents: parseInt(refs.courseSectionMaxStudents.value) || null,
      classType: refs.courseSectionClassType.value,
      status: refs.courseSectionStatus.value,
      note: refs.courseSectionNote.value,
      employeeId: employeeVal || null,
    };

    const url = id ? API_CONFIG.courseSections + '/' + id : API_CONFIG.courseSections;
    const method = id ? 'PUT' : 'POST';

    try {
      const { response } = await fetchJson(url, {
        method,
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });

      if (response.ok) {
        bootstrap.Modal.getInstance(document.getElementById('courseSectionModal'))?.hide();
        loadCourseSections(state.pagination.courseSections?.page || 0);
      } else {
        alert('Lỗi lưu lớp học phần!');
      }
    } catch (err) {
      console.error('[CourseSections] Save error', err);
      alert('Lỗi kết nối!');
    }
  }

  async function deleteSection(id) {
    if (!confirm('Bạn có chắc muốn xóa lớp học phần này?')) return;
    try {
      await fetchJson(API_CONFIG.courseSections + '/' + id, {
        method: 'DELETE',
        headers: buildAuthHeaders(state.authState),
      });
      loadCourseSections(state.pagination.courseSections?.page || 0);
    } catch (err) {
      console.error('[CourseSections] Delete error', err);
    }
  }

  async function editSection(id) {
    try {
      const { data } = await fetchJson(API_CONFIG.courseSections + '/' + id, {
        headers: buildAuthHeaders(state.authState),
      });
      await openModal(data);
    } catch (err) {
      console.error('[CourseSections] Edit load error', err);
    }
  }

  window.__editCourseSection__ = editSection;
  window.__deleteCourseSection__ = deleteSection;

  return {
    bindEvents() {
      refs.btnAddCourseSection?.addEventListener('click', () => openModal(null));
      refs.btnSaveCourseSection?.addEventListener('click', saveSection);

      let timer;
      refs.courseSectionSearchInput?.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => loadCourseSections(0), 400);
      });
    },
    loadCourseSections() {
      loadCourseSections(0);
    },
    showUnauthorizedState() {
      if (refs.courseSectionTableBody) {
        refs.courseSectionTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-3">Không có quyền truy cập.</td></tr>';
      }
    },
    resetLoggedOutState() {
      if (refs.courseSectionTableBody) refs.courseSectionTableBody.innerHTML = '';
      if (refs.courseSectionPagination) refs.courseSectionPagination.innerHTML = '';
      if (refs.courseSectionPaginationInfo) refs.courseSectionPaginationInfo.textContent = '';
      if (refs.courseSectionSearchInput) refs.courseSectionSearchInput.value = '';
      employeeList = [];
    }
  };
}
