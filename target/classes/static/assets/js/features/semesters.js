import { API_CONFIG, PAGE_SIZE } from '../core/config.js';
import { escapeHtml, highlightText, parseResponse } from '../core/utils.js';
import { buildAuthHeaders } from '../services/http.js';

export function createSemestersFeature(context) {
  const { state, refs, auth, showError, clearError } = context;

  function renderPagination() {
    const paginationState = state.pagination.semesters;
    if (paginationState.totalPages <= 1) {
      refs.semesterPagination.innerHTML = '';
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
    refs.semesterPagination.innerHTML = html;
  }

  function renderSemesters(semesters) {
    const term = refs.semesterSearchInput.value.trim();
    const paginationState = state.pagination.semesters;

    if (!semesters.length) {
      refs.semesterTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
    } else {
      refs.semesterTableBody.innerHTML = semesters
        .map(function (semester) {
          return (
            '<tr>' +
              '<td>' + highlightText(semester.code || '', term) + '</td>' +
              '<td>' + highlightText(semester.name || '', term) + '</td>' +
              '<td>' + escapeHtml(semester.schoolYearName || '') + '</td>' +
              '<td>' + escapeHtml(semester.startDate || '') + '</td>' +
              '<td>' + escapeHtml(semester.endDate || '') + '</td>' +
              '<td>' + (semester.isActive ? '<span class="badge bg-success">Đang mở</span>' : '<span class="badge bg-secondary">Đã đóng</span>') + '</td>' +
              '<td class="text-end">' +
                '<button class="btn btn-sm btn-outline-secondary me-1" data-id="' + escapeHtml(String(semester.id)) + '" data-action="edit-semester">' +
                  '<i class="bi bi-pencil"></i>' +
                '</button>' +
                '<button class="btn btn-sm btn-outline-danger" data-id="' + escapeHtml(String(semester.id)) + '" data-action="delete-semester">' +
                  '<i class="bi bi-trash"></i>' +
                '</button>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    const from = paginationState.totalElements === 0 ? 0 : paginationState.page * PAGE_SIZE + 1;
    const to = Math.min((paginationState.page + 1) * PAGE_SIZE, paginationState.totalElements);
    refs.semesterPaginationInfo.textContent =
      'Hiển thị ' + from + '–' + to + ' trên tổng ' + paginationState.totalElements + ' học kỳ';
    renderPagination();
  }

  async function loadSemesters() {
    clearError();
    refs.semesterTableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted py-3">Đang tải...</td></tr>';

    const keyword = encodeURIComponent(refs.semesterSearchInput.value.trim() || '');
    const currentPage = state.pagination.semesters.page;
    const searchUrl = API_CONFIG.semesters + '/search?keyword=' + keyword + '&page=' + currentPage + '&size=' + PAGE_SIZE;
    const baseUrl = API_CONFIG.semesters + '?keyword=' + keyword + '&page=' + currentPage + '&size=' + PAGE_SIZE;

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
      state.pagination.semesters.totalPages = parsed.totalPages;
      state.pagination.semesters.totalElements = parsed.totalElements;
      renderSemesters(parsed.items);
    } catch (error) {
      showError(error.message);
      refs.semesterTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle me-1"></i>Không thể tải dữ liệu</td></tr>';
    }
  }

  function openCreateModal() {
    if (!refs.semesterModal) {
      return;
    }

    refs.semesterIdInput.value = '';
    refs.semesterCodeInput.value = '';
    refs.semesterNameInput.value = '';
    refs.semesterSchoolYearNameInput.value = '';
    refs.semesterStartDateInput.value = '';
    refs.semesterEndDateInput.value = '';
    refs.semesterIsActiveInput.checked = true;
    refs.semesterModalTitle.textContent = 'Thêm Học kỳ';
    refs.btnSaveSemester.dataset.mode = 'create';
    refs.semesterModal.show();
  }

  async function saveSemester() {
    const mode = refs.btnSaveSemester.dataset.mode;
    const code = refs.semesterCodeInput.value.trim();
    const name = refs.semesterNameInput.value.trim();
    const schoolYearName = refs.semesterSchoolYearNameInput.value.trim();
    const startDate = refs.semesterStartDateInput.value;
    const endDate = refs.semesterEndDateInput.value;
    const isActive = refs.semesterIsActiveInput.checked;

    if (!code || !name) {
      alert('Vui lòng nhập đầy đủ mã và tên học kỳ.');
      return;
    }

    const isUpdate = mode === 'update';
    const url = isUpdate ? API_CONFIG.semesters + '/' + refs.semesterIdInput.value : API_CONFIG.semesters;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          code: code,
          name: name,
          schoolYearName: schoolYearName,
          startDate: startDate || null,
          endDate: endDate || null,
          isActive: isActive,
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

      if (refs.semesterModal) {
        refs.semesterModal.hide();
      }
      await loadSemesters();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu học kỳ:\n' + error.message);
    }
  }

  async function deleteSemester(id) {
    try {
      const response = await fetch(API_CONFIG.semesters + '/' + id, {
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

      if (state.pagination.semesters.page > 0) {
        state.pagination.semesters.page -= 1;
      }
      await loadSemesters();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa học kỳ:\n' + error.message);
    }
  }

  function bindEvents() {
    refs.btnAddSemester.addEventListener('click', openCreateModal);
    refs.btnSaveSemester.addEventListener('click', saveSemester);

    refs.semesterPagination.addEventListener('click', function (event) {
      if (event.target.tagName !== 'A') {
        return;
      }

      event.preventDefault();
      const page = Number(event.target.getAttribute('data-page'));
      const totalPages = state.pagination.semesters.totalPages;
      if (Number.isNaN(page) || page === state.pagination.semesters.page || page < 0 || page >= totalPages) {
        return;
      }

      state.pagination.semesters.page = page;
      loadSemesters();
    });

    refs.semesterSearchInput.addEventListener('input', function () {
      state.pagination.semesters.page = 0;
      loadSemesters();
    });

    refs.semesterTableBody.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) {
        return;
      }

      const id = button.getAttribute('data-id');
      const action = button.getAttribute('data-action');

      if (action === 'edit-semester') {
        fetch(API_CONFIG.semesters + '/' + id, { headers: buildAuthHeaders(state.authState) })
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
          .then(function (semester) {
            if (!refs.semesterModal) {
              return;
            }

            refs.semesterIdInput.value = semester.id || '';
            refs.semesterCodeInput.value = semester.code || '';
            refs.semesterNameInput.value = semester.name || '';
            refs.semesterSchoolYearNameInput.value = semester.schoolYearName || '';
            refs.semesterStartDateInput.value = semester.startDate || '';
            refs.semesterEndDateInput.value = semester.endDate || '';
            refs.semesterIsActiveInput.checked = semester.isActive;
            
            refs.semesterModalTitle.textContent = 'Cập nhật Học kỳ';
            refs.btnSaveSemester.dataset.mode = 'update';
            refs.semesterModal.show();
          })
          .catch(function (error) {
            alert('Không tải được thông tin học kỳ: ' + error.message);
          });
      }

      if (action === 'delete-semester' && confirm('Bạn có chắc chắn muốn xóa học kỳ này?')) {
        deleteSemester(id);
      }
    });
  }

  function resetLoggedOutState() {
    refs.semesterTableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted py-3">Đăng nhập để tải dữ liệu học kỳ</td></tr>';
    refs.semesterPagination.innerHTML = '';
    refs.semesterPaginationInfo.textContent = '';
  }

  function showUnauthorizedState() {
    refs.semesterTableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger py-3"><i class="bi bi-lock me-1"></i>Phiên đăng nhập đã hết hạn</td></tr>';
    refs.semesterPagination.innerHTML = '';
    refs.semesterPaginationInfo.textContent = '';
  }

  return {
    bindEvents,
    loadSemesters,
    resetLoggedOutState,
    showUnauthorizedState,
  };
}
