import { API_CONFIG, PAGE_SIZE } from '../core/config.js';
import { buildAuthHeaders, fetchJson } from '../services/http.js';
import { escapeHtml, highlightText, parseResponse } from '../core/utils.js';

export function createEmployeesFeature(context) {
  const { state, refs, auth } = context;

  function canManage() {
    return auth.hasRole('SUPER_ADMIN') || auth.hasRole('ACADEMIC_AFFAIRS');
  }

  async function loadEmployees(page) {
    if (!canManage()) return;
    page = page || 0;
    const keyword = refs.employeeSearchInput?.value?.trim() || '';
    const url = API_CONFIG.employees + '/search?page=' + page + '&size=' + PAGE_SIZE +
      (keyword ? '&keyword=' + encodeURIComponent(keyword) : '');

    try {
      const { response, data } = await fetchJson(url, {
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
      });
      if (!response.ok) {
        refs.employeeTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-3">Lỗi tải dữ liệu</td></tr>';
        return;
      }
      const parsed = parseResponse(data);
      state.pagination.employees = { page, totalPages: parsed.totalPages, totalElements: parsed.totalElements };
      renderTable(parsed.items, keyword);
      renderPagination(parsed.totalPages, page);
      renderPaginationInfo(page, parsed.items.length, parsed.totalElements);
    } catch (err) {
      console.error('[Employees] Load error', err);
      refs.employeeTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-3">Lỗi kết nối</td></tr>';
    }
  }

  function renderTable(items, keyword) {
    if (!items || items.length === 0) {
      refs.employeeTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
      return;
    }
    refs.employeeTableBody.innerHTML = items.map(function (e) {
      return '<tr>' +
        '<td>' + highlightText(e.code || '', keyword) + '</td>' +
        '<td>' +
          '<div class="fw-semibold">' + highlightText(e.fullName || '', keyword) + '</div>' +
          '<small class="text-muted">' + (e.username ? '<i class="bi bi-person-badge me-1"></i>' + escapeHtml(e.username) : '<span class="text-danger fst-italic">Chưa liên kết TK</span>') + '</small>' +
        '</td>' +
        '<td>' + escapeHtml(e.email || '') + '</td>' +
        '<td>' + escapeHtml(e.departmentName || '') + '</td>' +
        '<td>' + escapeHtml(e.academicDegree || '') + '</td>' +
        '<td class="text-end">' +
          '<button class="btn btn-warning btn-sm me-1" onclick="window.__editEmployee__(\'' + e.id + '\')"><i class="bi bi-pencil-square"></i></button>' +
          '<button class="btn btn-danger btn-sm" onclick="window.__deleteEmployee__(\'' + e.id + '\')"><i class="bi bi-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderPagination(totalPages, currentPage) {
    if (!refs.employeePagination) return;
    if (totalPages <= 1) { refs.employeePagination.innerHTML = ''; return; }
    let html = '';
    for (let i = 0; i < totalPages; i++) {
      html += '<li class="page-item ' + (i === currentPage ? 'active' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + i + '">' + (i + 1) + '</a></li>';
    }
    refs.employeePagination.innerHTML = html;
    refs.employeePagination.querySelectorAll('.page-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        loadEmployees(parseInt(link.dataset.page));
      });
    });
  }

  function renderPaginationInfo(page, count, total) {
    if (!refs.employeePaginationInfo) return;
    const start = page * PAGE_SIZE + 1;
    const end = page * PAGE_SIZE + count;
    refs.employeePaginationInfo.textContent = 'Hiển thị ' + start + '–' + end + ' / ' + total;
  }

  function openModal(employee) {
    refs.employeeModalTitle.textContent = employee ? 'Sửa giảng viên' : 'Thêm giảng viên';
    refs.employeeId.value = employee ? employee.id : '';
    refs.employeeCode.value = employee ? employee.code || '' : '';
    refs.employeeFullName.value = employee ? employee.fullName || '' : '';
    refs.employeeEmail.value = employee ? employee.email || '' : '';
    refs.employeePhone.value = employee ? employee.phone || '' : '';
    refs.employeeAcademicDegree.value = employee ? employee.academicDegree || '' : '';
    refs.employeeSpecialization.value = employee ? employee.specialization || '' : '';

    // Load department & user dropdowns
    loadDepartmentOptions(employee?.departmentId);
    loadUserOptions(employee?.userId);

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('employeeModal'));
    modal.show();
  }

  async function loadUserOptions(selectedId) {
    try {
      const { data } = await fetchJson(API_CONFIG.users, {
        headers: buildAuthHeaders(state.authState),
      });
      const users = Array.isArray(data) ? data : (data.content || []);
      
      // Filter users who have LECTURER or STAFF roles, OR is the currently selected user
      const filteredUsers = users.filter(u => {
        if (u.id === selectedId) return true;
        if (!u.roles) return false;
        return u.roles.some(r => r.code === 'LECTURER' || r.code === 'STAFF');
      });

      let html = '<option value="">-- Không liên kết --</option>';
      filteredUsers.forEach(function (u) {
        html += '<option value="' + u.id + '"' + (u.id === selectedId ? ' selected' : '') + '>' + escapeHtml(u.username + ' - ' + u.fullName) + '</option>';
      });
      if (refs.employeeUserId) refs.employeeUserId.innerHTML = html;
    } catch (err) {
      console.error('[Employees] Load users error', err);
    }
  }

  async function loadDepartmentOptions(selectedId) {
    try {
      const { data } = await fetchJson(API_CONFIG.departments, {
        headers: buildAuthHeaders(state.authState),
      });
      const depts = Array.isArray(data) ? data : (data.content || []);
      let html = '<option value="">Chọn khoa</option>';
      depts.forEach(function (d) {
        html += '<option value="' + d.id + '"' + (d.id === selectedId ? ' selected' : '') + '>' + escapeHtml(d.name) + '</option>';
      });
      refs.employeeDepartmentId.innerHTML = html;
    } catch (err) {
      console.error('[Employees] Load departments error', err);
    }
  }

  async function saveEmployee() {
    const id = refs.employeeId.value;
    const body = {
      code: refs.employeeCode.value,
      fullName: refs.employeeFullName.value,
      email: refs.employeeEmail.value,
      phone: refs.employeePhone.value,
      academicDegree: refs.employeeAcademicDegree.value,
      specialization: refs.employeeSpecialization.value,
      departmentId: refs.employeeDepartmentId.value || null,
      userId: refs.employeeUserId?.value || null,
    };

    const url = id ? API_CONFIG.employees + '/' + id : API_CONFIG.employees;
    const method = id ? 'PUT' : 'POST';

    try {
      const { response } = await fetchJson(url, {
        method,
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });

      if (response.ok) {
        bootstrap.Modal.getInstance(document.getElementById('employeeModal'))?.hide();
        loadEmployees(state.pagination.employees?.page || 0);
      } else {
        alert('Lỗi lưu giảng viên!');
      }
    } catch (err) {
      console.error('[Employees] Save error', err);
      alert('Lỗi kết nối!');
    }
  }

  async function deleteEmployee(id) {
    if (!confirm('Bạn có chắc muốn xóa giảng viên này?')) return;
    try {
      await fetchJson(API_CONFIG.employees + '/' + id, {
        method: 'DELETE',
        headers: buildAuthHeaders(state.authState),
      });
      loadEmployees(state.pagination.employees?.page || 0);
    } catch (err) {
      console.error('[Employees] Delete error', err);
    }
  }

  async function editEmployee(id) {
    try {
      const { data } = await fetchJson(API_CONFIG.employees + '/' + id, {
        headers: buildAuthHeaders(state.authState),
      });
      openModal(data);
    } catch (err) {
      console.error('[Employees] Edit load error', err);
    }
  }

  // Global handlers for inline onclick
  window.__editEmployee__ = editEmployee;
  window.__deleteEmployee__ = deleteEmployee;

  return {
    bindEvents() {
      refs.btnAddEmployee?.addEventListener('click', () => openModal(null));
      refs.btnSaveEmployee?.addEventListener('click', saveEmployee);

      let timer;
      refs.employeeSearchInput?.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => loadEmployees(0), 400);
      });
    },
    loadEmployees() {
      loadEmployees(0);
    },
    showUnauthorizedState() {
      if (refs.employeeTableBody) {
        refs.employeeTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-3">Không có quyền truy cập.</td></tr>';
      }
    },
    resetLoggedOutState() {
      if (refs.employeeTableBody) refs.employeeTableBody.innerHTML = '';
      if (refs.employeePagination) refs.employeePagination.innerHTML = '';
      if (refs.employeePaginationInfo) refs.employeePaginationInfo.textContent = '';
      if (refs.employeeSearchInput) refs.employeeSearchInput.value = '';
    }
  };
}
