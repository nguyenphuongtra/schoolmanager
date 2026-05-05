import { API_CONFIG, PAGE_SIZE } from '../core/config.js';
import { escapeHtml, highlightText, parseResponse } from '../core/utils.js';
import { buildAuthHeaders } from '../services/http.js';

export function createStudentsFeature(context) {
  const { state, refs, auth, showError, clearError } = context;

  function renderPagination() {
    const paginationState = state.pagination.students;
    if (paginationState.totalPages <= 1) {
      refs.pagination.innerHTML = '';
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
    refs.pagination.innerHTML = html;
  }

  function renderTable(students) {
    const term = refs.searchInput.value.trim();
    const allowManage = !auth.isStudentOnly();
    const paginationState = state.pagination.students;

    if (!students.length) {
      refs.studentTableBody.innerHTML =
        '<tr><td colspan="4" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
    } else {
      refs.studentTableBody.innerHTML = students
        .map(function (student) {
          return (
            '<tr>' +
              '<td>' + highlightText(student.studentCode || '', term) + '</td>' +
              '<td>' + highlightText(student.fullName || '', term) + '</td>' +
              '<td>' + escapeHtml(student.email || '') + '</td>' +
              '<td class="text-end">' +
                (allowManage
                  ? '<button class="btn btn-sm btn-outline-secondary me-1" data-id="' + escapeHtml(String(student.id)) + '" data-action="edit">' +
                      '<i class="bi bi-pencil"></i>' +
                    '</button>' +
                    '<button class="btn btn-sm btn-outline-danger" data-id="' + escapeHtml(String(student.id)) + '" data-action="delete">' +
                      '<i class="bi bi-trash"></i>' +
                    '</button>'
                  : '<span class="text-muted small">Chỉ xem</span>') +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    const from = paginationState.totalElements === 0 ? 0 : paginationState.page * PAGE_SIZE + 1;
    const to = Math.min((paginationState.page + 1) * PAGE_SIZE, paginationState.totalElements);
    refs.paginationInfo.textContent =
      'Hiển thị ' + from + '–' + to + ' trên tổng ' + paginationState.totalElements + ' sinh viên';
    renderPagination();
  }

  function resetForm() {
    refs.studentIdInput.value = '';
    refs.studentCodeInput.value = '';
    refs.studentFullNameInput.value = '';
    refs.studentEmailInput.value = '';
  }

  function openCreateModal() {
    if (!refs.studentModal) {
      return;
    }

    resetForm();
    refs.studentModalTitle.textContent = 'Thêm sinh viên';
    refs.btnSaveStudent.dataset.mode = 'create';
    refs.studentModal.show();
  }

  function openEditModal(student) {
    if (!refs.studentModal) {
      return;
    }

    refs.studentIdInput.value = student.id || '';
    refs.studentCodeInput.value = student.studentCode || '';
    refs.studentFullNameInput.value = student.fullName || '';
    refs.studentEmailInput.value = student.email || '';
    refs.studentModalTitle.textContent = 'Cập nhật sinh viên';
    refs.btnSaveStudent.dataset.mode = 'update';
    refs.studentModal.show();
  }

  async function loadStudents() {
    clearError();
    refs.studentTableBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-muted py-3">Đang tải...</td></tr>';

    if (auth.isStudentOnly()) {
      try {
        const response = await fetch(API_CONFIG.students + '/me', {
          headers: buildAuthHeaders(state.authState),
        });

        if (response.status === 401) {
          auth.handleUnauthorized('Token hết hạn hoặc chưa hợp lệ. Vui lòng đăng nhập lại.');
          return;
        }

        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ' – ' + response.statusText + ' (' + API_CONFIG.students + '/me)');
        }

        const student = await response.json();
        const students = student ? [student] : [];
        state.pagination.students.page = 0;
        state.pagination.students.totalPages = students.length > 0 ? 1 : 0;
        state.pagination.students.totalElements = students.length;
        renderTable(students);
      } catch (error) {
        showError(error.message);
        refs.studentTableBody.innerHTML =
          '<tr><td colspan="4" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle me-1"></i>Không thể tải dữ liệu</td></tr>';
      }
      return;
    }

    const keyword = encodeURIComponent(refs.searchInput.value.trim() || '');
    const currentPage = state.pagination.students.page;
    const searchUrl = API_CONFIG.students + '/search?keyword=' + keyword + '&page=' + currentPage + '&size=' + PAGE_SIZE;
    const baseUrl = API_CONFIG.students + '?keyword=' + keyword + '&page=' + currentPage + '&size=' + PAGE_SIZE;

    try {
      const response = await fetch(searchUrl, { headers: buildAuthHeaders(state.authState) });
      let data;

      if (response.status === 404) {
        const fallbackResponse = await fetch(baseUrl, { headers: buildAuthHeaders(state.authState) });
        if (fallbackResponse.status === 401) {
          auth.handleUnauthorized('Token hết hạn hoặc chưa hợp lệ. Vui lòng đăng nhập lại.');
          return;
        }
        if (!fallbackResponse.ok) {
          throw new Error('HTTP ' + fallbackResponse.status + ' – ' + fallbackResponse.statusText + ' (' + baseUrl + ')');
        }
        data = await fallbackResponse.json();
      } else if (response.status === 401) {
        auth.handleUnauthorized('Token hết hạn hoặc chưa hợp lệ. Vui lòng đăng nhập lại.');
        return;
      } else if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' – ' + response.statusText + ' (' + searchUrl + ')');
      } else {
        data = await response.json();
      }

      const parsed = parseResponse(data);
      state.pagination.students.totalPages = parsed.totalPages;
      state.pagination.students.totalElements = parsed.totalElements;
      renderTable(parsed.items);
    } catch (error) {
      const hint = error.message && error.message.includes('Failed to fetch')
        ? ' → Có thể do CORS hoặc backend chưa chạy. Hãy thêm @CrossOrigin vào Spring Controller.'
        : '';
      showError(error.message + hint);
      refs.studentTableBody.innerHTML =
        '<tr><td colspan="4" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle me-1"></i>Không thể tải dữ liệu</td></tr>';
    }
  }

  async function saveStudent() {
    const mode = refs.btnSaveStudent.dataset.mode;
    const studentCode = refs.studentCodeInput.value.trim();
    const fullName = refs.studentFullNameInput.value.trim();
    const email = refs.studentEmailInput.value.trim();

    if (!studentCode || !fullName) {
      alert('Vui lòng nhập đầy đủ mã sinh viên và họ tên.');
      return;
    }

    const isUpdate = mode === 'update';
    const url = isUpdate ? API_CONFIG.students + '/' + refs.studentIdInput.value : API_CONFIG.students;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ studentCode: studentCode, fullName: fullName, email: email }),
      });

      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errorText);
      }

      if (refs.studentModal) {
        refs.studentModal.hide();
      }
      await loadStudents();
    } catch (error) {
      console.error('Lỗi lưu sinh viên', error);
      alert('Có lỗi xảy ra khi lưu sinh viên:\n' + error.message);
    }
  }

  async function deleteStudent(id) {
    try {
      const response = await fetch(API_CONFIG.students + '/' + id, {
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

      if (state.pagination.students.page > 0) {
        state.pagination.students.page -= 1;
      }
      await loadStudents();
    } catch (error) {
      console.error('Lỗi xóa sinh viên', error);
      alert('Có lỗi xảy ra khi xóa sinh viên:\n' + error.message);
    }
  }

  function bindEvents() {
    refs.btnAdd.addEventListener('click', openCreateModal);
    refs.btnSaveStudent.addEventListener('click', saveStudent);

    refs.pagination.addEventListener('click', function (event) {
      if (event.target.tagName !== 'A') {
        return;
      }

      event.preventDefault();
      const page = Number(event.target.getAttribute('data-page'));
      const totalPages = state.pagination.students.totalPages;
      if (Number.isNaN(page) || page === state.pagination.students.page || page < 0 || page >= totalPages) {
        return;
      }

      state.pagination.students.page = page;
      loadStudents();
    });

    refs.searchInput.addEventListener('input', function () {
      if (auth.isStudentOnly()) {
        return;
      }

      state.pagination.students.page = 0;
      loadStudents();
    });

    refs.studentTableBody.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) {
        return;
      }

      const id = button.getAttribute('data-id');
      const action = button.getAttribute('data-action');

      if (action === 'edit') {
        if (auth.isStudentOnly()) {
          return;
        }

        fetch(API_CONFIG.students + '/' + id, { headers: buildAuthHeaders(state.authState) })
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
          .then(function (student) {
            openEditModal(student || {});
          })
          .catch(function (error) {
            alert('Không tải được thông tin sinh viên: ' + error.message);
          });
      }

      if (action === 'delete') {
        if (auth.isStudentOnly()) {
          return;
        }

        if (confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) {
          deleteStudent(id);
        }
      }
    });
  }

  function resetLoggedOutState() {
    refs.studentTableBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-muted py-3">Đăng nhập để tải dữ liệu sinh viên</td></tr>';
    refs.pagination.innerHTML = '';
    refs.paginationInfo.textContent = '';
  }

  function showUnauthorizedState() {
    refs.studentTableBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-danger py-3"><i class="bi bi-lock me-1"></i>Phiên đăng nhập đã hết hạn</td></tr>';
    refs.pagination.innerHTML = '';
    refs.paginationInfo.textContent = '';
  }

  return {
    bindEvents,
    loadStudents,
    resetLoggedOutState,
    showUnauthorizedState,
  };
}
