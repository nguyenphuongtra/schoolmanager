import { API_CONFIG, PAGE_SIZE } from '../core/config.js';
import { escapeHtml, highlightText, parseResponse } from '../core/utils.js';
import { buildAuthHeaders } from '../services/http.js';

export function createMajorsFeature(context) {
  const { state, refs, auth, departments, showError, clearError } = context;

  function renderPagination() {
    const paginationState = state.pagination.majors;
    if (paginationState.totalPages <= 1) {
      refs.majorPagination.innerHTML = '';
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
    refs.majorPagination.innerHTML = html;
  }

  function renderMajors(majors) {
    const term = refs.majorSearchInput.value.trim();
    const paginationState = state.pagination.majors;

    if (!majors.length) {
      refs.majorTableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
    } else {
      refs.majorTableBody.innerHTML = majors
        .map(function (major) {
          return (
            '<tr>' +
              '<td>' + highlightText(major.majorCode || '', term) + '</td>' +
              '<td>' + highlightText(major.majorName || '', term) + '</td>' +
              '<td>' + escapeHtml(major.departmentName || '') + '</td>' +
              '<td>' + escapeHtml(major.effectiveDate || '') + '</td>' +
              '<td>' + escapeHtml(major.expiryDate || '') + '</td>' +
              '<td class="text-end">' +
                '<button class="btn btn-sm btn-outline-secondary me-1" data-id="' + escapeHtml(String(major.id)) + '" data-action="edit-major">' +
                  '<i class="bi bi-pencil"></i>' +
                '</button>' +
                '<button class="btn btn-sm btn-outline-danger" data-id="' + escapeHtml(String(major.id)) + '" data-action="delete-major">' +
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
    refs.majorPaginationInfo.textContent =
      'Hiển thị ' + from + '–' + to + ' trên tổng ' + paginationState.totalElements + ' ngành học';
    renderPagination();
  }

  async function loadMajors() {
    clearError();
    refs.majorTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-3">Đang tải...</td></tr>';

    const keyword = encodeURIComponent(refs.majorSearchInput.value.trim() || '');
    const currentPage = state.pagination.majors.page;
    const searchUrl = API_CONFIG.majors + '/search?keyword=' + keyword + '&page=' + currentPage + '&size=' + PAGE_SIZE;
    const baseUrl = API_CONFIG.majors + '?keyword=' + keyword + '&page=' + currentPage + '&size=' + PAGE_SIZE;

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
      state.pagination.majors.totalPages = parsed.totalPages;
      state.pagination.majors.totalElements = parsed.totalElements;
      renderMajors(parsed.items);
    } catch (error) {
      showError(error.message);
      refs.majorTableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle me-1"></i>Không thể tải dữ liệu</td></tr>';
    }
  }

  async function openCreateModal() {
    if (!refs.majorModal) {
      return;
    }

    await departments.ensureDepartmentOptions();
    refs.majorIdInput.value = '';
    refs.majorDepartmentIdInput.value = '';
    refs.majorCodeInput.value = '';
    refs.majorNameInput.value = '';
    refs.majorEffectiveDateInput.value = '';
    refs.majorExpiryDateInput.value = '';
    refs.majorDescriptionInput.value = '';
    refs.majorModalTitle.textContent = 'Thêm ngành học';
    refs.btnSaveMajor.dataset.mode = 'create';
    refs.majorModal.show();
  }

  async function saveMajor() {
    const mode = refs.btnSaveMajor.dataset.mode;
    const departmentId = refs.majorDepartmentIdInput.value.trim();
    const majorCode = refs.majorCodeInput.value.trim();
    const majorName = refs.majorNameInput.value.trim();
    const effectiveDate = refs.majorEffectiveDateInput.value.trim();
    const expiryDate = refs.majorExpiryDateInput.value.trim();
    const description = refs.majorDescriptionInput.value.trim();

    if (!departmentId || !majorCode || !majorName) {
      alert('Vui lòng chọn khoa và nhập đầy đủ mã ngành, tên ngành.');
      return;
    }

    const isUpdate = mode === 'update';
    const url = isUpdate ? API_CONFIG.majors + '/' + refs.majorIdInput.value : API_CONFIG.majors;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          departmentId: departmentId,
          majorCode: majorCode,
          majorName: majorName,
          effectiveDate: effectiveDate || null,
          expiryDate: expiryDate || null,
          description: description || null,
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

      if (refs.majorModal) {
        refs.majorModal.hide();
      }
      await loadMajors();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu ngành học:\n' + error.message);
    }
  }

  async function deleteMajor(id) {
    try {
      const response = await fetch(API_CONFIG.majors + '/' + id, {
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

      if (state.pagination.majors.page > 0) {
        state.pagination.majors.page -= 1;
      }
      await loadMajors();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa ngành học:\n' + error.message);
    }
  }

  function bindEvents() {
    refs.btnAddMajor.addEventListener('click', openCreateModal);
    refs.btnSaveMajor.addEventListener('click', saveMajor);

    refs.majorPagination.addEventListener('click', function (event) {
      if (event.target.tagName !== 'A') {
        return;
      }

      event.preventDefault();
      const page = Number(event.target.getAttribute('data-page'));
      const totalPages = state.pagination.majors.totalPages;
      if (Number.isNaN(page) || page === state.pagination.majors.page || page < 0 || page >= totalPages) {
        return;
      }

      state.pagination.majors.page = page;
      loadMajors();
    });

    refs.majorSearchInput.addEventListener('input', function () {
      state.pagination.majors.page = 0;
      loadMajors();
    });

    refs.majorTableBody.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) {
        return;
      }

      const id = button.getAttribute('data-id');
      const action = button.getAttribute('data-action');

      if (action === 'edit-major') {
        fetch(API_CONFIG.majors + '/' + id, { headers: buildAuthHeaders(state.authState) })
          .then(async function (response) {
            if (response.status === 401) {
              auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
              throw new Error('Unauthorized');
            }
            if (!response.ok) {
              throw new Error('HTTP ' + response.status);
            }
            await departments.ensureDepartmentOptions();
            return response.json();
          })
          .then(function (major) {
            if (!refs.majorModal) {
              return;
            }

            refs.majorIdInput.value = major.id || '';
            refs.majorDepartmentIdInput.value = major.departmentId || '';
            refs.majorCodeInput.value = major.majorCode || '';
            refs.majorNameInput.value = major.majorName || '';
            refs.majorEffectiveDateInput.value = major.effectiveDate || '';
            refs.majorExpiryDateInput.value = major.expiryDate || '';
            refs.majorDescriptionInput.value = major.description || '';
            refs.majorModalTitle.textContent = 'Cập nhật ngành học';
            refs.btnSaveMajor.dataset.mode = 'update';
            refs.majorModal.show();
          })
          .catch(function (error) {
            alert('Không tải được thông tin ngành học: ' + error.message);
          });
      }

      if (action === 'delete-major' && confirm('Bạn có chắc chắn muốn xóa ngành học này?')) {
        deleteMajor(id);
      }
    });
  }

  function resetLoggedOutState() {
    refs.majorTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-3">Đăng nhập để tải dữ liệu ngành học</td></tr>';
    refs.majorPagination.innerHTML = '';
    refs.majorPaginationInfo.textContent = '';
  }

  function showUnauthorizedState() {
    refs.majorTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger py-3"><i class="bi bi-lock me-1"></i>Phiên đăng nhập đã hết hạn</td></tr>';
    refs.majorPagination.innerHTML = '';
    refs.majorPaginationInfo.textContent = '';
  }

  return {
    bindEvents,
    loadMajors,
    resetLoggedOutState,
    showUnauthorizedState,
  };
}
