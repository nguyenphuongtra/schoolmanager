import { API_CONFIG, PAGE_SIZE } from '../core/config.js';
import { escapeHtml, highlightText, parseResponse } from '../core/utils.js';
import { buildAuthHeaders } from '../services/http.js';

export function createDepartmentsFeature(context) {
  const { state, refs, auth, showError, clearError } = context;

  // Cache for loaded courses per department
  const coursesCache = {};
  // Track which departments have expanded courses
  const expandedDepartments = {};

  function renderPagination() {
    const paginationState = state.pagination.departments;
    if (paginationState.totalPages <= 1) {
      refs.departmentPagination.innerHTML = '';
      return;
    }

    let html = '';
    html += '<li class="page-item ' + (paginationState.page === 0 ? 'disabled' : '') + '">';
    html += '<a class="page-link" href="#" data-page="' + (paginationState.page - 1) + '">&laquo;</a></li>';

    for (let index = 0; index < paginationState.totalPages; index += 1) {
      html += '<li class="page-item ' + (index === paginationState.page ? 'active' : '') + '">';
      html += '<a class="page-link" href="#" data-page="' + index + '">' + (index + 1) + '</a></li>';
    }

    html += '<li class="page-item ' + (paginationState.page === paginationState.totalPages - 1 ? 'disabled' : '') + '">';
    html += '<a class="page-link" href="#" data-page="' + (paginationState.page + 1) + '">&raquo;</a></li>';
    refs.departmentPagination.innerHTML = html;
  }

  function renderCoursesRow(departmentId, courses) {
    const row = document.getElementById('courses-row-' + departmentId);
    if (!row) return;

    if (!courses || courses.length === 0) {
      row.querySelector('td').innerHTML =
        '<div class="p-2 text-muted text-center"><em>Chưa có môn học nào cho khoa này</em></div>';
      return;
    }

    let html = '<div class="p-2">';
    html += '<table class="table table-sm table-bordered mb-0" style="background:#f8f9fa;">';
    html += '<thead class="table-light"><tr>';
    html += '<th style="width:12%">Mã MH</th>';
    html += '<th style="width:25%">Tên môn học</th>';
    html += '<th style="width:20%">Tên tiếng Anh</th>';
    html += '<th style="width:8%" class="text-center">Tín chỉ</th>';
    html += '<th style="width:10%">Loại</th>';
    html += '<th style="width:8%" class="text-center">LT</th>';
    html += '<th style="width:8%" class="text-center">TH</th>';
    html += '<th style="width:9%">Mô tả</th>';
    html += '</tr></thead><tbody>';

    courses.forEach(function (course) {
      html += '<tr>';
      html += '<td><code>' + escapeHtml(course.code || '') + '</code></td>';
      html += '<td>' + escapeHtml(course.name || '') + '</td>';
      html += '<td class="text-muted">' + escapeHtml(course.nameEn || '') + '</td>';
      html += '<td class="text-center fw-bold">' + escapeHtml(String(course.credits || '')) + '</td>';
      html += '<td>' + (course.courseType === 'Bắt buộc'
        ? '<span class="badge bg-primary">Bắt buộc</span>'
        : '<span class="badge bg-secondary">Tùy chọn</span>') + '</td>';
      html += '<td class="text-center">' + escapeHtml(String(course.theoryHours || '')) + '</td>';
      html += '<td class="text-center">' + escapeHtml(String(course.practiceHours || '')) + '</td>';
      html += '<td>' + escapeHtml(course.description || '') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    html += '<div class="text-muted small mt-1">Tổng: ' + courses.length + ' môn học</div>';
    html += '</div>';

    row.querySelector('td').innerHTML = html;
  }

  async function toggleCourses(departmentId) {
    const row = document.getElementById('courses-row-' + departmentId);
    const btn = document.querySelector('button[data-action="toggle-courses"][data-id="' + departmentId + '"]');

    if (!row) return;

    // Toggle visibility
    if (expandedDepartments[departmentId]) {
      row.style.display = 'none';
      expandedDepartments[departmentId] = false;
      if (btn) {
        btn.innerHTML = '<i class="bi bi-book"></i>';
        btn.classList.remove('btn-info');
        btn.classList.add('btn-outline-info');
        btn.title = 'Xem môn học';
      }
      return;
    }

    // Show row
    row.style.display = '';
    expandedDepartments[departmentId] = true;
    if (btn) {
      btn.innerHTML = '<i class="bi bi-book-fill"></i>';
      btn.classList.remove('btn-outline-info');
      btn.classList.add('btn-info');
      btn.title = 'Ẩn môn học';
    }

    // If already cached, render immediately
    if (coursesCache[departmentId]) {
      renderCoursesRow(departmentId, coursesCache[departmentId]);
      return;
    }

    // Show loading
    row.querySelector('td').innerHTML =
      '<div class="p-2 text-center text-muted"><i class="bi bi-hourglass-split me-1"></i>Đang tải môn học...</div>';

    try {
      const response = await fetch(API_CONFIG.courses + '/department/' + departmentId, {
        headers: buildAuthHeaders(state.authState),
      });

      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const courses = await response.json();
      coursesCache[departmentId] = courses;
      renderCoursesRow(departmentId, courses);
    } catch (error) {
      row.querySelector('td').innerHTML =
        '<div class="p-2 text-center text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Không thể tải môn học: ' + escapeHtml(error.message) + '</div>';
    }
  }

  function renderDepartments(departments) {
    const term = refs.departmentSearchInput.value.trim();
    const paginationState = state.pagination.departments;

    // Clear expanded state on re-render
    Object.keys(expandedDepartments).forEach(function (key) {
      expandedDepartments[key] = false;
    });

    if (!departments.length) {
      refs.departmentTableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
    } else {
      refs.departmentTableBody.innerHTML = departments
        .map(function (department) {
          return (
            '<tr>' +
              '<td>' + highlightText(department.code || '', term) + '</td>' +
              '<td>' + highlightText(department.name || '', term) + '</td>' +
              '<td>' + escapeHtml(department.establishedYear || '') + '</td>' +
              '<td>' + escapeHtml(department.description || '') + '</td>' +
              '<td class="text-end">' +
                '<button class="btn btn-sm btn-outline-info me-1" data-id="' + escapeHtml(String(department.id)) + '" data-action="toggle-courses" title="Xem môn học">' +
                  '<i class="bi bi-book"></i>' +
                '</button>' +
                '<button class="btn btn-sm btn-outline-secondary me-1" data-id="' + escapeHtml(String(department.id)) + '" data-action="edit-department">' +
                  '<i class="bi bi-pencil"></i>' +
                '</button>' +
                '<button class="btn btn-sm btn-outline-danger" data-id="' + escapeHtml(String(department.id)) + '" data-action="delete-department">' +
                  '<i class="bi bi-trash"></i>' +
                '</button>' +
              '</td>' +
            '</tr>' +
            '<tr id="courses-row-' + escapeHtml(String(department.id)) + '" style="display:none;">' +
              '<td colspan="6" class="p-0 border-0"></td>' +
            '</tr>'
          );
        })
        .join('');
    }

    const from = paginationState.totalElements === 0 ? 0 : paginationState.page * PAGE_SIZE + 1;
    const to = Math.min((paginationState.page + 1) * PAGE_SIZE, paginationState.totalElements);
    refs.departmentPaginationInfo.textContent =
      'Hiển thị ' + from + '–' + to + ' trên tổng ' + paginationState.totalElements + ' khoa/phòng ban';
    renderPagination();
  }

  function renderDepartmentOptions() {
    const optionsHtml =
      '<option value="">Chọn khoa/phòng ban</option>' +
      state.departmentOptions
        .map(function (department) {
          return '<option value="' + escapeHtml(String(department.id)) + '">' +
            escapeHtml((department.code || '') + ' - ' + (department.name || '')) +
          '</option>';
        })
        .join('');

    refs.majorDepartmentIdInput.innerHTML = optionsHtml;
    refs.trainingProgramDepartmentIdInput.innerHTML = optionsHtml;
  }

  async function ensureDepartmentOptions() {
    if (state.departmentOptions.length > 0) {
      renderDepartmentOptions();
      return;
    }

    try {
      const response = await fetch(API_CONFIG.departments, {
        headers: buildAuthHeaders(state.authState),
      });

      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        throw new Error('Không tải được danh sách khoa/phòng ban');
      }

      const data = await response.json();
      state.departmentOptions = Array.isArray(data) ? data : parseResponse(data).items;
      renderDepartmentOptions();
    } catch (error) {
      showError(error.message);
    }
  }

  async function loadDepartments() {
    clearError();
    refs.departmentTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-3">Đang tải...</td></tr>';

    const keyword = encodeURIComponent(refs.departmentSearchInput.value.trim() || '');
    const currentPage = state.pagination.departments.page;
    const searchUrl = API_CONFIG.departments + '/search?keyword=' + keyword + '&page=' + currentPage + '&size=' + PAGE_SIZE;
    const baseUrl = API_CONFIG.departments + '?keyword=' + keyword + '&page=' + currentPage + '&size=' + PAGE_SIZE;

    try {
      const response = await fetch(searchUrl, { headers: buildAuthHeaders(state.authState) });
      let data;

      if (response.status === 404) {
        const fallbackResponse = await fetch(baseUrl, { headers: buildAuthHeaders(state.authState) });
        if (fallbackResponse.status === 401) {
          auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }
        if (!fallbackResponse.ok) {
          throw new Error('HTTP ' + fallbackResponse.status + ' – ' + fallbackResponse.statusText + ' (' + baseUrl + ')');
        }
        data = await fallbackResponse.json();
      } else if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      } else if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' – ' + response.statusText + ' (' + searchUrl + ')');
      } else {
        data = await response.json();
      }

      const parsed = parseResponse(data);
      state.pagination.departments.totalPages = parsed.totalPages;
      state.pagination.departments.totalElements = parsed.totalElements;
      renderDepartments(parsed.items);
    } catch (error) {
      showError(error.message);
      refs.departmentTableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle me-1"></i>Không thể tải dữ liệu</td></tr>';
    }
  }

  function openCreateModal() {
    if (!refs.departmentModal) {
      return;
    }

    refs.departmentIdInput.value = '';
    refs.departmentCodeInput.value = '';
    refs.departmentNameInput.value = '';
    refs.departmentEstablishedYearInput.value = '';
    refs.departmentDescriptionInput.value = '';
    refs.departmentModalTitle.textContent = 'Thêm khoa/phòng ban';
    refs.btnSaveDepartment.dataset.mode = 'create';
    refs.departmentModal.show();
  }

  async function saveDepartment() {
    const mode = refs.btnSaveDepartment.dataset.mode;
    const code = refs.departmentCodeInput.value.trim();
    const name = refs.departmentNameInput.value.trim();
    const establishedYear = refs.departmentEstablishedYearInput.value.trim();
    const description = refs.departmentDescriptionInput.value.trim();

    if (!code || !name) {
      alert('Vui lòng nhập đầy đủ mã và tên khoa/phòng ban.');
      return;
    }

    const isUpdate = mode === 'update';
    const url = isUpdate ? API_CONFIG.departments + '/' + refs.departmentIdInput.value : API_CONFIG.departments;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          code: code,
          name: name,
          establishedYear: establishedYear ? Number(establishedYear) : null,
          description: description,
        }),
      });

      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errorText);
      }

      state.departmentOptions = [];
      if (refs.departmentModal) {
        refs.departmentModal.hide();
      }
      await loadDepartments();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu khoa/phòng ban:\n' + error.message);
    }
  }

  async function deleteDepartment(id) {
    try {
      const response = await fetch(API_CONFIG.departments + '/' + id, {
        method: 'DELETE',
        headers: buildAuthHeaders(state.authState),
      });

      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errorText);
      }

      state.departmentOptions = [];
      if (state.pagination.departments.page > 0) {
        state.pagination.departments.page -= 1;
      }
      await loadDepartments();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa khoa/phòng ban:\n' + error.message);
    }
  }

  function bindEvents() {
    refs.btnAddDepartment.addEventListener('click', openCreateModal);
    refs.btnSaveDepartment.addEventListener('click', saveDepartment);

    refs.departmentPagination.addEventListener('click', function (event) {
      if (event.target.tagName !== 'A') {
        return;
      }

      event.preventDefault();
      const page = Number(event.target.getAttribute('data-page'));
      const totalPages = state.pagination.departments.totalPages;
      if (Number.isNaN(page) || page === state.pagination.departments.page || page < 0 || page >= totalPages) {
        return;
      }

      state.pagination.departments.page = page;
      loadDepartments();
    });

    refs.departmentSearchInput.addEventListener('input', function () {
      state.pagination.departments.page = 0;
      loadDepartments();
    });

    refs.departmentTableBody.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) {
        return;
      }

      const id = button.getAttribute('data-id');
      const action = button.getAttribute('data-action');

      if (action === 'toggle-courses') {
        toggleCourses(id);
        return;
      }

      if (action === 'edit-department') {
        fetch(API_CONFIG.departments + '/' + id, { headers: buildAuthHeaders(state.authState) })
          .then(function (response) {
            if (response.status === 401) {
              auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
              throw new Error('Unauthorized');
            }
            if (!response.ok) {
              throw new Error('HTTP ' + response.status);
            }
            return response.json();
          })
          .then(function (department) {
            if (!refs.departmentModal) {
              return;
            }

            refs.departmentIdInput.value = department.id || '';
            refs.departmentCodeInput.value = department.code || '';
            refs.departmentNameInput.value = department.name || '';
            refs.departmentEstablishedYearInput.value = department.establishedYear || '';
            refs.departmentDescriptionInput.value = department.description || '';
            refs.departmentModalTitle.textContent = 'Cập nhật khoa/phòng ban';
            refs.btnSaveDepartment.dataset.mode = 'update';
            refs.departmentModal.show();
          })
          .catch(function (error) {
            alert('Không tải được thông tin khoa/phòng ban: ' + error.message);
          });
      }

      if (action === 'delete-department' && confirm('Bạn có chắc chắn muốn xóa khoa/phòng ban này?')) {
        deleteDepartment(id);
      }
    });
  }

  function resetLoggedOutState() {
    refs.departmentTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-3">Đăng nhập để tải dữ liệu khoa/phòng ban</td></tr>';
    refs.departmentPagination.innerHTML = '';
    refs.departmentPaginationInfo.textContent = '';
  }

  function showUnauthorizedState() {
    refs.departmentTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger py-3"><i class="bi bi-lock me-1"></i>Phiên đăng nhập đã hết hạn</td></tr>';
    refs.departmentPagination.innerHTML = '';
    refs.departmentPaginationInfo.textContent = '';
  }

  return {
    bindEvents,
    ensureDepartmentOptions,
    loadDepartments,
    resetLoggedOutState,
    showUnauthorizedState,
  };
}
